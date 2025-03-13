# XLSX to XML Converter

A web application that converts Excel files (XLSX/XLS) to XML format with a specific structure. The application provides a modern, user-friendly interface with drag-and-drop functionality.

## Features

- Drag and drop file upload
- Support for XLSX and XLS files
- Modern and responsive UI
- Real-time conversion
- Automatic file download after conversion

## Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)

## Installation

1. Clone this repository or download the files
2. Navigate to the project directory
3. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
node server.js
```

2. Open your web browser and navigate to `http://localhost:3000`

3. Either drag and drop an Excel file into the upload area or click "Choose File" to select one

4. Click the "Convert to XML" button to start the conversion

5. The converted XML file will automatically download when ready

## Supported Excel Structure

The application expects Excel files with a structure similar to the following:
- Headers in the first row
- Data in subsequent rows
- The XML output will maintain the structure with appropriate data types (String/Number)

## Error Handling

- The application validates file types before upload
- Server-side error handling for conversion process
- User-friendly error messages

## Technologies Used

- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express
- File Processing: xlsx library
- File Upload: multer 