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

    // Load saved values from localStorage
    function loadSavedValues() {
        const savedDetails = localStorage.getItem('details');
        const savedTaxCode = localStorage.getItem('taxCode');
        const savedPayerAcc = localStorage.getItem('payerAcc');

        if (savedDetails) detailsInput.value = savedDetails;
        if (savedTaxCode) taxCodeInput.value = savedTaxCode;
        if (savedPayerAcc) payerAccInput.value = savedPayerAcc;
    }

    // Save values to localStorage
    function saveValues() {
        localStorage.setItem('details', detailsInput.value);
        localStorage.setItem('taxCode', taxCodeInput.value);
        localStorage.setItem('payerAcc', payerAccInput.value);
    }

    // Load saved values when page loads
    loadSavedValues();

    // Save values when they change
    [detailsInput, taxCodeInput, payerAccInput].forEach(input => {
        input.addEventListener('input', () => {
            saveValues();
            validateInputs();
        });
    });

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
                const errorData = await response.json();
                throw new Error(errorData.details || 'Conversion failed');
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
            alert(`Error converting file: ${error.message}`);
        } finally {
            loading.style.display = 'none';
            convertBtn.disabled = false;
        }
    });
}); 