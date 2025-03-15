const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const cors = require('cors');
const { getFormattedDate } = require('./dateUtils');

const app = express();
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

app.use(cors());
app.use(express.static('public'));

const convertHandler = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).send('No file uploaded');
            return;
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        const manualInputs = {
            docDate: getFormattedDate(),
            taxCode: req.body.taxCode === 'null' ? '' : (req.body.taxCode || ''),
            details: req.body.details === 'null' ? '' : (req.body.details || ''),
            payerAcc: req.body.payerAcc === 'null' ? '' : (req.body.payerAcc || '')
        };
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            blankrows: true
        });

        const headerRow = jsonData[0];
        if (!headerRow || 
            headerRow[0] !== "Employee ID" || 
            headerRow[1] !== "Amount" || 
            headerRow[2] !== "Account number" || 
            headerRow[3] !== "Bank name" || 
            headerRow[4] !== "Beneficiary Name") {
            throw new Error("Invalid Excel format: Expected columns are 'Employee ID', 'Amount', 'Account number', 'Bank name', 'Beneficiary Name'");
        }
        
        let xmlContent = `<?xml version="1.0" encoding="utf-16" standalone="yes"?>
<As_Import-Export_File>
  <PayOrd>`;

        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row.some(cell => cell !== '')) {
                while (row.length < 5) {
                    row.push('');
                }

                const docNum = row[0] ? row[0].toString().trim() : '';
                const amount = row[1] ? parseFloat(row[1].toString()).toFixed(1) : '0';
                const benAcc = row[2] ? row[2].toString().trim() : '';
                const beneficiary = row[4] ? row[4].toString().trim() : '';

                if (isNaN(parseFloat(amount))) {
                    console.error(`Error: Invalid amount format in row ${i}`);
                    continue;
                }

                xmlContent += `
    <PayOrd DOCNUM="${docNum}" DOCDATE="${manualInputs.docDate}" PAYERACC="${manualInputs.payerAcc}" TAXCODE="${manualInputs.taxCode}" SOCIALCARD="" BENACC="${benAcc}" BENEFICIARY="${beneficiary}" AMOUNT="${amount}" CURRENCY="AMD" DETAILS="${manualInputs.details}"/>`;
            }
        }

        xmlContent += `
  </PayOrd>
  <PayBudg />
</As_Import-Export_File>`;

        const currentDate = getFormattedDate().replace(/\//g, '_');
        const filename = `PayOrder_${currentDate}.xml`;

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(xmlContent);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error converting file');
    }
};

app.post('/api/convert', upload.single('file'), convertHandler);

if (process.env.NODE_ENV !== 'production') {
    const PORT = Number(process.env.PORT) || 3001;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app; 