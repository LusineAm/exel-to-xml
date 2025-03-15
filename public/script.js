import { getFormattedDate } from './dateUtils.js';

document.addEventListener('DOMContentLoaded', () => {    
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const convertBtn = document.getElementById('convertBtn');
    const removeFileBtn = document.getElementById('removeFile');
    const loading = document.getElementById('loading');
    const uploadButton = document.querySelector('.upload-button');
    
    const detailsInput = document.getElementById('details');
    const taxCodeInput = document.getElementById('taxCode');
    const payerAccInput = document.getElementById('payerAcc');
    
    let currentFile = null;

    function validateInputs() {
        const details = detailsInput.value.trim();
        const taxCode = taxCodeInput.value.trim();
        const payerAcc = payerAccInput.value.trim();

        let isValid = true;

        if (!details) {
            detailsInput.classList.add('invalid');
            isValid = false;
        } else {
            detailsInput.classList.remove('invalid');
        }

        if (!taxCode) {
            taxCodeInput.classList.add('invalid');
            isValid = false;
        } else {
            taxCodeInput.classList.remove('invalid');
        }

        if (!payerAcc) {
            payerAccInput.classList.add('invalid');
            isValid = false;
        } else {
            payerAccInput.classList.remove('invalid');
        }

        return isValid;
    }

    [detailsInput, taxCodeInput, payerAccInput].forEach(input => {
        input.addEventListener('input', () => {
            validateInputs();
        });
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFile(files[0]);
    });

    uploadButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });

    dropZone.addEventListener('click', (e) => {
        if (e.target === dropZone || e.target.tagName === 'P' || e.target.tagName === 'IMG') {
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleFile(e.target.files[0]);
    });

    removeFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentFile = null;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        dropZone.style.display = 'block';
    });

    function handleFile(file) {
        if (!file) return;
                
        const isExcel = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ].includes(file.type);

        if (!isExcel) {
            alert('Please upload an Excel file (.xls or .xlsx)');
            return;
        }

        currentFile = file;
        fileName.textContent = file.name;
        fileInfo.style.display = 'block';
        dropZone.style.display = 'none';
    }

    convertBtn.addEventListener('click', async () => {
        if (!currentFile) {
            alert('Please select a file first');
            return;
        }

        if (!validateInputs()) {
            alert('Please fill in all required fields');
            return;
        }

        const formData = new FormData();
        formData.append('file', currentFile);
        
        const details = detailsInput.value.trim();
        const taxCode = taxCodeInput.value.trim();
        const payerAcc = payerAccInput.value.trim();
        
        formData.append('details', details);
        formData.append('taxCode', taxCode);
        formData.append('payerAcc', payerAcc);

        loading.style.display = 'block';
        convertBtn.disabled = true;

        try {
            const baseUrl = window.location.origin;
            const response = await fetch(`${baseUrl}/api/convert`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Conversion failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            const currentDate = getFormattedDate().replace(/\//g, '_');
            a.download = `PayOrder_${currentDate}.xml`;
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error:', error);
            alert('Error converting file. Please try again.');
        } finally {
            loading.style.display = 'none';
            convertBtn.disabled = false;
        }
    });
}); 