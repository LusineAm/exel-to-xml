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
const docNum = String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0');

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
            payerAcc: req.body.payerAcc === 'null' ? '' : (req.body.payerAcc || ''),
            docNum: docNum || '0001'
        };
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            blankrows: true
        });

        const headerRow = jsonData[0];
        
        if (!headerRow || 
            headerRow[0] !== "Account number" || 
            headerRow[1] !== "Bank name" || 
            headerRow[2] !== "Beneficiary Name" || 
            headerRow[3] !== "Meal allowance"
        ) {
            console.log('Header validation failed. Expected:', ['Account number', 'Bank name', 'Beneficiary Name', 'Amount']);
            throw new Error("Invalid Excel format. Please ensure your Excel file has the following columns in order: Account number, Bank name, Beneficiary Name, Amount");
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

                const amount = row[3] ? parseFloat(row[3].toString()).toFixed(1) : '0';
                const benAcc = row[0] ? row[0].toString().trim() : '';
                const beneficiary = row[2] ? row[2].toString().trim() : '';
                const uniqueDocNum = String(i).padStart(4, '0');

                if (isNaN(parseFloat(amount))) {
                    console.error(`Error: Invalid amount format in row ${i}`);
                    continue;
                }

                xmlContent += `
    <PayOrd DOCNUM="${uniqueDocNum}" DOCDATE="${manualInputs.docDate}" PAYERACC="${manualInputs.payerAcc}" TAXCODE="${manualInputs.taxCode}" SOCIALCARD="" BENACC="${benAcc}" BENEFICIARY="${beneficiary}" AMOUNT="${amount}" CURRENCY="AMD" DETAILS="${manualInputs.details}"/>`;
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
        res.status(500).json({ 
            error: 'Error converting file',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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