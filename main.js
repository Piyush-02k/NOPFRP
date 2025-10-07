document.addEventListener('DOMContentLoaded', () => {
    // State and element variables
    let isLoggedIn = false;
    const mainContent = document.getElementById('main-content');
    const loginPage = document.getElementById('page-login');
    const loginLogoutButton = document.getElementById('login-logout-button');
    const loginForm = document.getElementById('login-form');
    const backToHomeLink = document.getElementById('back-to-home-link');
    const adminViewLink = document.getElementById('admin-view-link');
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');
    const upiCheckForm = document.getElementById('upi-check-form');
    const resultPageContainer = document.getElementById('page-result');
    const qrUploadInput = document.getElementById('qr-upload-input');

    // --- Custom Notification System (replaces alert()) ---
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const colors = {
            info: { bg: 'bg-blue-500', icon: 'info' },
            success: { bg: 'bg-brand-green', icon: 'check_circle' },
            error: { bg: 'bg-brand-red', icon: 'error' }
        };
        const notification = document.createElement('div');
        notification.className = `p-4 rounded-lg text-white shadow-lg mb-2 transform translate-x-full opacity-0 transition-all duration-300 ease-out ${colors[type].bg}`;
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="material-icons-outlined">${colors[type].icon}</span>
                <p>${message}</p>
            </div>
        `;
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 10);

        // Animate out and remove after 4 seconds
        setTimeout(() => {
            notification.classList.add('opacity-0', 'translate-x-full');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 4000);
    }

    // --- Login and Authentication Flow ---
    function showLoginPage() {
        mainContent.style.display = 'none';
        loginPage.style.display = 'flex';
    }

    function hideLoginPage() {
        loginPage.style.display = 'none';
        mainContent.style.display = 'block';
    }

    loginLogoutButton.addEventListener('click', () => {
        if (isLoggedIn) {
            isLoggedIn = false;
            loginLogoutButton.textContent = 'Login';
            adminViewLink.classList.add('hidden');
            showNotification('You have been logged out.');
            showPage('home');
        } else {
            showLoginPage();
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        isLoggedIn = true;
        loginLogoutButton.textContent = 'Logout';
        adminViewLink.classList.remove('hidden');
        hideLoginPage();
        showPage('admin');
        showNotification('Login successful! Welcome.', 'success');
    });

    backToHomeLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideLoginPage();
        showPage('home');
    });

    // --- SPA Navigation ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeInUp');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    function showPage(pageId) {
        if (pageId === 'admin' && !isLoggedIn) {
            showNotification('You must be logged in to view this page.', 'error');
            showPage('home');
            return; 
        }

        pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === `page-${pageId}`) {
                page.classList.add('active');
                // Re-observe animatable elements on the now-active page
                page.querySelectorAll('.animatable').forEach(el => {
                    observer.observe(el);
                });
            }
        });
        window.location.hash = pageId;
        window.scrollTo(0, 0);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('href').substring(1);
            showPage(pageId);
        });
    });

    function handleHashChange() {
        const pageId = window.location.hash.substring(1) || 'home';
        showPage(pageId);
    }
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial page load

    // --- UPI Score Check Logic ---
    upiCheckForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const upiIdInput = document.getElementById('upi-id-input').value.toLowerCase().trim();
        if (!upiIdInput) {
            showNotification("Please enter a UPI ID or phone number.", "error");
            return;
        };
        checkUpi(upiIdInput);
    });
    
    function checkUpi(identifier) {
        let resultHtml = '';
        const isPhoneNumber = /^\d{10}$/.test(identifier);

        if (isPhoneNumber) {
            if (identifier === '9876543210') resultHtml = createResultCard('high-risk', identifier);
            else if (identifier === '9999999999') resultHtml = createResultCard('safe', identifier);
            else resultHtml = createResultCard('no-data', identifier);
        } else {
            if (identifier.includes('scam') || identifier.includes('fraud')) resultHtml = createResultCard('high-risk', identifier);
            else if (identifier.includes('safe') || identifier.includes('merchant')) resultHtml = createResultCard('safe', identifier);
            else resultHtml = createResultCard('no-data', identifier);
        }

        resultPageContainer.innerHTML = resultHtml;
        showPage('result');
    }

    // --- **FIX APPLIED HERE** ---
    // Removed 'invisible-for-animation' and 'animatable' classes from the returned HTML string.
    // This ensures the result card is visible immediately without relying on the Intersection Observer, fixing the blank screen bug.
    function createResultCard(type, upiId) {
        let content = {};
        switch (type) {
            case 'high-risk':
                content = {
                    bannerClass: 'bg-brand-red', icon: 'warning', title: 'HIGH RISK - FRAUD SUSPECTED', score: 85, scoreColor: 'text-brand-red',
                    summary: `<p><span class="font-semibold">Total Reports:</span> 32</p><p><span class="font-semibold">Verified Flags:</span> 8</p><p><span class="font-semibold">Last Reported:</span> Oct 5, 2025</p>`,
                    activity: `<h4 class="font-semibold text-lg mt-6 mb-2">Recent Activity</h4><ul class="space-y-1 text-gray-600 list-disc list-inside"><li>Fake Product Scam</li><li>OTP Vishing Scam</li></ul>`,
                    action: `<button class="w-full mt-6 bg-brand-red text-white py-3 rounded-lg font-bold text-lg hover:opacity-90" onclick="showModal('report-fraud-modal')">Report this ID</button>`
                }; break;
            case 'safe':
                content = {
                    bannerClass: 'bg-brand-green', icon: 'verified_user', title: 'LOW RISK - LOOKS SAFE', score: 4, scoreColor: 'text-brand-green',
                    summary: `<p><span class="font-semibold">Total Reports:</span> 0</p><p><span class="font-semibold">Verified Since:</span> Jan 12, 2024</p>`,
                    activity: `<div class="mt-6 p-4 bg-green-50 text-brand-green rounded-lg flex items-center gap-2"><span class="material-icons-outlined">task_alt</span>This UPI ID has a clean record.</div>`,
                    action: `<a href="#home" class="nav-link text-center block w-full mt-6 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300">Back to Home</a>`
                }; break;
            case 'no-data':
                content = {
                    bannerClass: 'bg-brand-yellow', icon: 'help_outline', title: 'CAUTION - NO DATA', score: 'N/A', scoreColor: 'text-brand-yellow',
                    summary: ``,
                    activity: `<div class="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-start gap-2"><span class="material-icons-outlined mt-1">info</span><div>This ID is new or has no reported history. Exercise caution.</div></div>`,
                    action: `<a href="#home" class="nav-link text-center block w-full mt-6 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300">Back to Home</a>`
                }; break;
        }
        // The root div here no longer has animation classes.
        return `<div class="bg-white rounded-xl shadow-lg max-w-2xl mx-auto overflow-hidden animate-fadeInUp"><div class="${content.bannerClass} text-white p-4 flex items-center justify-center space-x-2"><span class="material-icons-outlined">${content.icon}</span><h3 class="font-bold text-lg">${content.title}</h3></div><div class="p-6"><p class="text-center font-semibold text-xl break-words">${upiId}</p><div class="my-6 text-center"><p class="text-7xl font-bold ${content.scoreColor}">${content.score}</p><p class="text-gray-500">FraudScore</p></div><div class="text-gray-700 text-sm space-y-1">${content.summary}</div>${content.activity}${content.action}</div></div>`;
    }

    // --- Report Fraud Modal Logic ---
    const reportFraudModal = document.getElementById('report-fraud-modal');
    const modalContent = reportFraudModal.querySelector('.modal-content');

    window.showModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            if (modalId === 'report-fraud-modal') renderModalStep(1);
        }
    };
    
    window.closeModal = () => { reportFraudModal.style.display = 'none'; }
    reportFraudModal.addEventListener('click', (e) => { if (e.target === reportFraudModal) closeModal(); });
    
    function handleModalStep1Next() {
        const upiInput = document.getElementById('fraud-upi-id-input');
        const amountInput = document.getElementById('fraud-amount-input');
        const amount = parseFloat(amountInput.value) || 0;

        if (!upiInput.value || !amountInput.value) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }

        if (amount >= 10000) {
            closeModal();
            // Prefill the high-value form
            document.getElementById('hv-upi-id').value = upiInput.value;
            document.getElementById('hv-amount').value = amount;
            showPage('high-value');
        } else {
            renderModalStep(2);
        }
    }

    window.renderModalStep = (step) => {
        let html = '';
        switch(step) {
            case 1: 
                html = `<div class="p-6"><p class="text-center text-sm text-gray-500 mb-2">Step 1 of 7</p><h3 class="text-2xl font-bold text-center mb-4">Fraud Details</h3><div class="space-y-4"><div><label class="font-medium">Fraudulent UPI ID</label><input type="text" id="fraud-upi-id-input" class="w-full mt-1 p-2 border border-gray-300 rounded-lg"></div><div><label class="font-medium">Amount Lost (₹)</label><input type="number" id="fraud-amount-input" class="w-full mt-1 p-2 border border-gray-300 rounded-lg" placeholder="e.g., 5000"></div><div><label class="font-medium">Transaction ID</label><input type="text" class="w-full mt-1 p-2 border border-gray-300 rounded-lg"></div><div><label class="font-medium">Date of Transaction</label><input type="date" class="w-full mt-1 p-2 border border-gray-300 rounded-lg"></div></div><div class="mt-6 flex space-x-2"><button onclick="closeModal()" class="w-1/2 bg-gray-200 py-2 rounded-lg font-semibold">Cancel</button><button id="modal-step1-next" class="w-1/2 bg-brand-blue text-white py-2 rounded-lg font-semibold">Next</button></div></div>`; 
                modalContent.innerHTML = html;
                document.getElementById('modal-step1-next').addEventListener('click', handleModalStep1Next);
                break;
            case 2:
                html = `<div class="p-6"><p class="text-center text-sm text-gray-500 mb-2">Step 2 of 7</p><h3 class="text-2xl font-bold text-center mb-4">Describe the Incident</h3><div class="space-y-4"><div><label for="fraud-category" class="font-medium">Type of Fraud</label><select id="fraud-category" class="w-full mt-1 p-2 border border-gray-300 rounded-lg"><option>QR Code Scam</option><option>Product Not Delivered</option><option>OTP/Vishing Scam</option><option>Investment Scam</option><option>Other</option></select></div><div><label for="fraud-description" class="font-medium">Brief Description</label><textarea id="fraud-description" rows="3" class="w-full mt-1 p-2 border border-gray-300 rounded-lg" placeholder="Explain what happened..."></textarea></div></div><div class="mt-6 flex space-x-2"><button onclick="renderModalStep(1)" class="w-1/2 bg-gray-200 py-2 rounded-lg font-semibold">Back</button><button onclick="renderModalStep(3)" class="w-1/2 bg-brand-blue text-white py-2 rounded-lg font-semibold">Next</button></div></div>`;
                modalContent.innerHTML = html;
                break;
            case 3: // This case is updated
                html = `<div class="p-6"><p class="text-center text-sm text-gray-500 mb-2">Step 3 of 7</p><h3 class="text-2xl font-bold text-center mb-4">Bank Details</h3><div class="space-y-4"><div><label for="bank-name" class="font-medium">Your Bank Name</label><input type="text" id="bank-name" class="w-full mt-1 p-2 border border-gray-300 rounded-lg" placeholder="e.g., State Bank of India"></div><div><label for="bank-branch" class="font-medium">Bank Branch</label><input type="text" id="bank-branch" class="w-full mt-1 p-2 border border-gray-300 rounded-lg" placeholder="e.g., Mumbai Main Branch"></div><div><label for="account-number" class="font-medium">Your Account Number</label><input type="text" id="account-number" class="w-full mt-1 p-2 border border-gray-300 rounded-lg"></div><div><label for="ifsc-code" class="font-medium">IFSC Code</label><input type="text" id="ifsc-code" class="w-full mt-1 p-2 border border-gray-300 rounded-lg"></div></div><p class="text-xs text-gray-500 mt-2">This information is required by banks to process the fraud claim.</p><div class="mt-6 flex space-x-2"><button onclick="renderModalStep(2)" class="w-1/2 bg-gray-200 py-2 rounded-lg font-semibold">Back</button><button onclick="renderModalStep(4)" class="w-1/2 bg-brand-blue text-white py-2 rounded-lg font-semibold">Next</button></div></div>`;
                modalContent.innerHTML = html;
                break;
            case 4:
                html = `<div class="p-6"><p class="text-center text-sm text-gray-500 mb-2">Step 4 of 7</p><h3 class="text-2xl font-bold text-center mb-4">Upload Evidence</h3><div class="space-y-2"><div><label for="fraud-evidence" class="font-medium">Upload Screenshot</label><input id="fraud-evidence" type="file" class="w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-blue hover:file:bg-blue-100"></div><p class="text-xs text-gray-500">Please upload a screenshot of the transaction, chat, or QR code. (Optional but recommended)</p></div><div class="mt-6 flex space-x-2"><button onclick="renderModalStep(3)" class="w-1/2 bg-gray-200 py-2 rounded-lg font-semibold">Back</button><button onclick="renderModalStep(5)" class="w-1/2 bg-brand-blue text-white py-2 rounded-lg font-semibold">Next</button></div></div>`;
                modalContent.innerHTML = html;
                break;
            case 5: 
                html = `<div class="p-6"><p class="text-center text-sm text-gray-500 mb-2">Step 5 of 7</p><h3 class="text-2xl font-bold text-center mb-4">Your Contact</h3><div><label class="font-medium">Your 10-Digit Mobile Number</label><input type="tel" class="w-full mt-1 p-2 border border-gray-300 rounded-lg"></div><p class="text-xs text-gray-500 mt-2">For OTP verification and case updates only.</p><div class="mt-6 flex space-x-2"><button onclick="renderModalStep(4)" class="w-1/2 bg-gray-200 py-2 rounded-lg font-semibold">Back</button><button onclick="renderModalStep(6)" class="w-1/2 bg-brand-blue text-white py-2 rounded-lg font-semibold">Get OTP</button></div></div>`; 
                modalContent.innerHTML = html;
                break;
            case 6: 
                html = `<div class="p-6"><p class="text-center text-sm text-gray-500 mb-2">Step 6 of 7</p><h3 class="text-2xl font-bold text-center mb-4">Verification</h3><div><label class="font-medium">Enter 6-Digit OTP</label><input type="text" class="w-full mt-1 p-2 border border-gray-300 rounded-lg text-center text-xl tracking-[.5em]"></div><p class="text-sm text-gray-500 mt-2 text-center">Resend OTP in 30s</p><div class="mt-6 flex space-x-2"><button onclick="renderModalStep(5)" class="w-1/2 bg-gray-200 py-2 rounded-lg font-semibold">Back</button><button onclick="renderModalStep(7)" class="w-1/2 bg-brand-blue text-white py-2 rounded-lg font-semibold">Submit</button></div></div>`; 
                modalContent.innerHTML = html;
                break;
            case 7: 
                html = `<div class="p-8 text-center"><span class="material-icons-outlined text-7xl text-brand-green">check_circle</span><h3 class="text-2xl font-bold mt-4">Complaint Filed!</h3><p class="text-gray-600 mt-2">Your Complaint ID is:</p><p class="font-bold text-lg bg-gray-100 p-2 rounded-md mt-1">FSIN-98127645</p><button onclick="closeModal()" class="w-full mt-6 bg-brand-blue text-white py-3 rounded-lg font-semibold">Done</button></div>`; 
                modalContent.innerHTML = html;
                break;
        }
    };
    
    // --- Chart.js for Admin Dashboard ---
    function renderAdminChart() {
        const ctx = document.getElementById('fraudTrendsChart');
        if (ctx && !Chart.getChart(ctx)) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [
                        { label: 'QR Code Scams', data: [65, 59, 80, 81], borderColor: '#C62828', tension: 0.2 },
                        { label: 'OTP/Vishing', data: [28, 48, 40, 19], borderColor: '#0D47A1', tension: 0.2 }
                    ]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            });
        }
    }
    if (window.location.hash === '#admin') renderAdminChart();
    document.querySelector('a[href="#admin"]').addEventListener('click', renderAdminChart);

    // --- QR CODE UPLOAD LOGIC ---
    qrUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        showNotification(`Simulating scan of ${file.name}...`, 'info');
        
        let upiIdentifier = 'scanned-new@user';
        if (file.name.toLowerCase().includes('scam')) upiIdentifier = 'scanned-scammer@upi';
        else if (file.name.toLowerCase().includes('safe')) upiIdentifier = 'scanned-safe@merchant';
        
        setTimeout(() => checkUpi(upiIdentifier), 1000);
        
        upiCheckForm.reset();
    });

    
    document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("track-report-form");
        const statusBox = document.getElementById("report-status");
        const statusText = document.getElementById("status-text");

        if (form) {
            form.addEventListener("submit", (e) => {
            e.preventDefault();

            // simulate complaint tracking result
            statusBox.classList.remove("hidden");
            statusText.textContent = "In Progress — Verified and Assigned to Cyber Cell";

            statusBox.scrollIntoView({ behavior: "smooth" });
            });
        }
    });
    
    // Add this new form handler at the bottom of the file
    document.getElementById('high-value-form').addEventListener('submit', (e) => {
        e.preventDefault();
        showNotification('High-value report submitted successfully!', 'success');
        showPage('home');
        e.target.reset(); // Clear the form
    });

});
