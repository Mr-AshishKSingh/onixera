/**
 * Offer Letter Generator
 * Generates personalized offer letters and converts them to PDF
 */

// Load html2pdf library dynamically
function loadHtml2Pdf() {
    return new Promise((resolve) => {
        if (window.html2pdf) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve();
        document.head.appendChild(script);
    });
}

/**
 * Generate offer letter with personalized data
 * @param {Object} data - Student data
 * @param {string} data.name - Student name
 * @param {string} data.domain - Domain/Position
 * @param {string} data.duration - Probation duration
 * @returns {Promise} Resolves with generated HTML
 */
export async function generateOfferLetter(data) {
    try {
        // Fetch the template
        const response = await fetch('./assets/offer-letter-template.html');
        let template = await response.text();
        
        // Get current date
        const today = new Date();
        const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        
        // Replace placeholders
        template = template.replace(/{{NAME}}/g, data.name || 'Student Name');
        template = template.replace(/{{DOMAIN}}/g, data.domain || 'Position');
        template = template.replace(/{{DURATION}}/g, data.duration || '3 months from the date of joining');
        
        // Update date
        template = template.replace(/<p id="date">[\s\S]*?<\/p>/i, `<p id="date">${dateStr}</p>`);
        
        return template;
    } catch (error) {
        console.error('Error generating offer letter:', error);
        throw error;
    }
}

/**
 * Download offer letter as PDF
 * @param {Object} data - Student data
 * @param {string} data.name - Student name
 * @param {string} data.domain - Domain/Position
 * @param {string} data.duration - Probation duration
 */
export async function downloadOfferLetterPDF(data) {
    try {
        // Load html2pdf library
        await loadHtml2Pdf();
        
        // Generate offer letter HTML
        const letterHTML = await generateOfferLetter(data);
        
        // Create temporary container
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = letterHTML;
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        
        // Configure PDF options
        const options = {
            margin: [10, 10, 10, 10],
            filename: `Offer_Letter_${data.name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Generate and download PDF
        await html2pdf().set(options).from(tempDiv.querySelector('.container')).save();
        
        // Clean up
        document.body.removeChild(tempDiv);
        
        return true;
    } catch (error) {
        console.error('Error downloading offer letter:', error);
        throw error;
    }
}

/**
 * Display offer letter in a modal/preview
 * @param {Object} data - Student data
 * @param {string} data.name - Student name
 * @param {string} data.domain - Domain/Position
 * @param {string} data.duration - Probation duration
 */
export async function displayOfferLetterPreview(data) {
    try {
        // Generate offer letter HTML
        const letterHTML = await generateOfferLetter(data);
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 8px;
            width: 100%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;
        
        // Add letter content
        modalContent.innerHTML = letterHTML;
        
        // Add button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            position: sticky;
            bottom: 0;
            background: white;
            padding: 20px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        `;
        
        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download PDF';
        downloadBtn.style.cssText = `
            padding: 10px 20px;
            background: #0f766e;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        `;
        downloadBtn.onclick = async () => {
            downloadBtn.disabled = true;
            downloadBtn.textContent = 'Downloading...';
            try {
                await downloadOfferLetterPDF(data);
                downloadBtn.textContent = 'Downloaded!';
            } catch (error) {
                downloadBtn.textContent = 'Download Failed';
                console.error('Download error:', error);
            }
        };
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            padding: 10px 20px;
            background: #f0f0f0;
            color: #333;
            border: 1px solid #d0d0d0;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        `;
        closeBtn.onclick = () => document.body.removeChild(modal);
        
        buttonContainer.appendChild(downloadBtn);
        buttonContainer.appendChild(closeBtn);
        modalContent.appendChild(buttonContainer);
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error displaying offer letter:', error);
        alert('Error displaying offer letter. Please try again.');
    }
}