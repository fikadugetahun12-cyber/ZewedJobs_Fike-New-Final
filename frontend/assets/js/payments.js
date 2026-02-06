/**
 * ZewedJobs - Payment Gateway Handling
 * Ethiopian and international payment processing
 */

class PaymentManager {
    constructor() {
        this.selectedMethod = null;
        this.amount = 0;
        this.currency = 'ETB';
        this.paymentData = {};
        this.paymentConfig = {};
        this.initialize();
    }

    initialize() {
        console.log('💳 Payment Manager initialized');
        
        // Load payment configuration
        this.loadPaymentConfig();
        
        // Initialize payment methods
        this.initPaymentMethods();
        this.initPaymentForm();
        this.initMobileMoney();
        this.initBankTransfer();
        this.initCreditCard();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Check for pending payments
        this.checkPendingPayments();
    }

    async loadPaymentConfig() {
        try {
            const response = await fetch('/api/payment/config');
            if (response.ok) {
                this.paymentConfig = await response.json();
                console.log('Payment config loaded:', this.paymentConfig);
            }
        } catch (error) {
            console.error('Failed to load payment config:', error);
        }
    }

    initPaymentMethods() {
        // Handle payment method selection
        document.querySelectorAll('.payment-method-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectPaymentMethod(card.dataset.method);
            });
        });

        // Handle mobile money option selection
        document.querySelectorAll('.mobile-money-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectMobileMoneyOption(option.dataset.provider);
            });
        });

        // Handle bank option selection
        document.querySelectorAll('.bank-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectBankOption(option.dataset.bank);
            });
        });
    }

    initPaymentForm() {
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.processPayment();
            });
        }

        // Currency selection
        document.querySelectorAll('.currency-option').forEach(option => {
            option.addEventListener('click', () => {
                this.selectCurrency(option.dataset.currency);
            });
        });

        // Amount input
        const amountInput = document.getElementById('payment-amount');
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                this.amount = parseFloat(e.target.value) || 0;
                this.updatePaymentSummary();
            });
        }
    }

    initMobileMoney() {
        // Telebirr form
        const telebirrForm = document.getElementById('telebirr-form');
        if (telebirrForm) {
            telebirrForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.processTelebirrPayment();
            });
        }

        // CBE Birr form
        const cbeBirrForm = document.getElementById('cbe-birr-form');
        if (cbeBirrForm) {
            cbeBirrForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.processCbeBirrPayment();
            });
        }

        // Chapa form
        const chapaForm = document.getElementById('chapa-form');
        if (chapaForm) {
            chapaForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.processChapaPayment();
            });
        }
    }

    initBankTransfer() {
        const bankTransferForm = document.getElementById('bank-transfer-form');
        if (bankTransferForm) {
            bankTransferForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.processBankTransfer();
            });
        }

        // Generate reference number
        const generateRefBtn = document.getElementById('generate-reference');
        if (generateRefBtn) {
            generateRefBtn.addEventListener('click', () => {
                this.generateReferenceNumber();
            });
        }
    }

    initCreditCard() {
        // Card number formatting
        const cardNumberInput = document.getElementById('card-number');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                this.formatCardNumber(e.target);
            });
        }

        // Card expiry formatting
        const cardExpiryInput = document.getElementById('card-expiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', (e) => {
                this.formatCardExpiry(e.target);
            });
        }

        // Card validation
        const cardForm = document.getElementById('credit-card-form');
        if (cardForm) {
            cardForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.processCreditCardPayment();
            });
        }
    }

    initEventListeners() {
        // Payment step navigation
        document.querySelectorAll('.step').forEach(step => {
            step.addEventListener('click', () => {
                const stepNumber = parseInt(step.dataset.step);
                this.goToStep(stepNumber);
            });
        });

        // Back button
        const backBtn = document.getElementById('payment-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.previousStep();
            });
        }

        // Continue button
        const continueBtn = document.getElementById('payment-continue');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.nextStep();
            });
        }

        // Cancel payment
        const cancelBtn = document.getElementById('payment-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.cancelPayment();
            });
        }

        // Payment success actions
        document.getElementById('view-receipt')?.addEventListener('click', () => {
            this.viewReceipt();
        });

        document.getElementById('download-invoice')?.addEventListener('click', () => {
            this.downloadInvoice();
        });

        document.getElementById('back-to-home')?.addEventListener('click', () => {
            window.location.href = '/';
        });
    }

    // Payment Method Selection
    selectPaymentMethod(method) {
        this.selectedMethod = method;
        
        // Update UI
        document.querySelectorAll('.payment-method-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`.payment-method-card[data-method="${method}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        // Show corresponding form
        this.showPaymentForm(method);
        
        // Update step
        this.goToStep(2);
        
        console.log('Selected payment method:', method);
    }

    showPaymentForm(method) {
        // Hide all forms
        document.querySelectorAll('.payment-form').forEach(form => {
            form.style.display = 'none';
        });
        
        // Show selected form
        const form = document.getElementById(`${method}-form`);
        if (form) {
            form.style.display = 'block';
        }
        
        // Update payment summary
        this.updatePaymentSummary();
    }

    selectMobileMoneyOption(provider) {
        this.paymentData.mobileProvider = provider;
        
        // Update UI
        document.querySelectorAll('.mobile-money-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`.mobile-money-option[data-provider="${provider}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }

    selectBankOption(bank) {
        this.paymentData.bank = bank;
        
        // Update UI
        document.querySelectorAll('.bank-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`.bank-option[data-bank="${bank}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }

    selectCurrency(currency) {
        this.currency = currency;
        
        // Update UI
        document.querySelectorAll('.currency-option').forEach(option => {
            option.classList.remove('active');
        });
        
        const selectedOption = document.querySelector(`.currency-option[data-currency="${currency}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }
        
        // Update amount display
        this.updatePaymentSummary();
    }

    // Payment Processing
    async processPayment() {
        if (!this.validatePayment()) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (!window.userAuth?.isAuthenticated) {
            showNotification('Please login to complete payment', 'warning');
            openModal('auth-modal');
            return;
        }
        
        // Show processing screen
        this.showProcessing();
        
        try {
            let result;
            
            switch (this.selectedMethod) {
                case 'telebirr':
                    result = await this.processTelebirrPayment();
                    break;
                case 'cbe-birr':
                    result = await this.processCbeBirrPayment();
                    break;
                case 'chapa':
                    result = await this.processChapaPayment();
                    break;
                case 'bank-transfer':
                    result = await this.processBankTransfer();
                    break;
                case 'credit-card':
                    result = await this.processCreditCardPayment();
                    break;
                case 'paypal':
                    result = await this.processPayPalPayment();
                    break;
                default:
                    throw new Error('Invalid payment method');
            }
            
            if (result.success) {
                this.showPaymentSuccess(result);
            } else {
                throw new Error(result.message || 'Payment failed');
            }
        } catch (error) {
            this.showPaymentError(error.message);
            console.error('Payment error:', error);
        }
    }

    async processTelebirrPayment() {
        const phone = document.getElementById('telebirr-phone').value;
        
        if (!phone || phone.length !== 10) {
            throw new Error('Please enter a valid phone number');
        }
        
        const paymentData = {
            method: 'telebirr',
            amount: this.amount,
            currency: this.currency,
            phone: phone,
            description: this.paymentData.description || 'ZewedJobs Payment'
        };
        
        const response = await this.makePaymentRequest(paymentData);
        return response;
    }

    async processCbeBirrPayment() {
        const phone = document.getElementById('cbe-birr-phone').value;
        
        if (!phone || phone.length !== 10) {
            throw new Error('Please enter a valid phone number');
        }
        
        const paymentData = {
            method: 'cbe-birr',
            amount: this.amount,
            currency: this.currency,
            phone: phone,
            description: this.paymentData.description || 'ZewedJobs Payment'
        };
        
        const response = await this.makePaymentRequest(paymentData);
        return response;
    }

    async processChapaPayment() {
        const email = document.getElementById('chapa-email').value;
        const firstName = document.getElementById('chapa-first-name').value;
        const lastName = document.getElementById('chapa-last-name').value;
        
        if (!email || !this.validateEmail(email)) {
            throw new Error('Please enter a valid email address');
        }
        
        const paymentData = {
            method: 'chapa',
            amount: this.amount,
            currency: this.currency,
            email: email,
            firstName: firstName,
            lastName: lastName,
            description: this.paymentData.description || 'ZewedJobs Payment'
        };
        
        const response = await this.makePaymentRequest(paymentData);
        return response;
    }

    async processBankTransfer() {
        const reference = document.getElementById('bank-reference').value;
        
        if (!reference) {
            throw new Error('Please generate a reference number');
        }
        
        const paymentData = {
            method: 'bank-transfer',
            amount: this.amount,
            currency: this.currency,
            bank: this.paymentData.bank,
            reference: reference,
            description: this.paymentData.description || 'ZewedJobs Payment'
        };
        
        const response = await this.makePaymentRequest(paymentData);
        return response;
    }

    async processCreditCardPayment() {
        const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
        const cardExpiry = document.getElementById('card-expiry').value;
        const cardCvc = document.getElementById('card-cvc').value;
        const cardName = document.getElementById('card-name').value;
        
        // Validate card details
        if (!this.validateCardNumber(cardNumber)) {
            throw new Error('Invalid card number');
        }
        
        if (!this.validateCardExpiry(cardExpiry)) {
            throw new Error('Invalid expiry date');
        }
        
        if (!cardCvc || cardCvc.length < 3) {
            throw new Error('Invalid CVC');
        }
        
        if (!cardName) {
            throw new Error('Please enter cardholder name');
        }
        
        const paymentData = {
            method: 'credit-card',
            amount: this.amount,
            currency: this.currency,
            cardNumber: cardNumber,
            cardExpiry: cardExpiry,
            cardCvc: cardCvc,
            cardName: cardName,
            description: this.paymentData.description || 'ZewedJobs Payment'
        };
        
        const response = await this.makePaymentRequest(paymentData);
        return response;
    }

    async processPayPalPayment() {
        // PayPal payment implementation
        const paymentData = {
            method: 'paypal',
            amount: this.amount,
            currency: this.currency,
            description: this.paymentData.description || 'ZewedJobs Payment'
        };
        
        const response = await this.makePaymentRequest(paymentData);
        return response;
    }

    async makePaymentRequest(paymentData) {
        const response = await fetch('/api/payments/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.userAuth?.authToken || ''}`
            },
            body: JSON.stringify(paymentData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Payment request failed');
        }
        
        return data;
    }

    // Payment Flow Management
    goToStep(stepNumber) {
        // Update steps UI
        document.querySelectorAll('.step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            
            step.classList.remove('active');
            step.classList.remove('completed');
            
            if (stepNum < stepNumber) {
                step.classList.add('completed');
            } else if (stepNum === stepNumber) {
                step.classList.add('active');
            }
        });
        
        // Show corresponding section
        document.querySelectorAll('.payment-step').forEach(section => {
            section.classList.remove('active');
        });
        
        const stepSection = document.getElementById(`step-${stepNumber}`);
        if (stepSection) {
            stepSection.classList.add('active');
        }
    }

    nextStep() {
        const currentStep = this.getCurrentStep();
        if (currentStep < 4) {
            this.goToStep(currentStep + 1);
        }
    }

    previousStep() {
        const currentStep = this.getCurrentStep();
        if (currentStep > 1) {
            this.goToStep(currentStep - 1);
        }
    }

    getCurrentStep() {
        const activeStep = document.querySelector('.step.active');
        return activeStep ? parseInt(activeStep.dataset.step) : 1;
    }

    // Validation
    validatePayment() {
        if (!this.selectedMethod) {
            showNotification('Please select a payment method', 'error');
            return false;
        }
        
        if (this.amount <= 0) {
            showNotification('Please enter a valid amount', 'error');
            return false;
        }
        
        // Method-specific validation
        switch (this.selectedMethod) {
            case 'telebirr':
            case 'cbe-birr':
                return this.validateMobileMoney();
            case 'chapa':
                return this.validateChapa();
            case 'bank-transfer':
                return this.validateBankTransfer();
            case 'credit-card':
                return this.validateCreditCard();
            default:
                return true;
        }
    }

    validateMobileMoney() {
        const provider = this.paymentData.mobileProvider;
        if (!provider) {
            showNotification('Please select a mobile money provider', 'error');
            return false;
        }
        
        const phoneInput = document.getElementById(`${provider}-phone`);
        if (phoneInput && (!phoneInput.value || phoneInput.value.length !== 10)) {
            showNotification('Please enter a valid phone number', 'error');
            return false;
        }
        
        return true;
    }

    validateChapa() {
        const email = document.getElementById('chapa-email')?.value;
        if (!email || !this.validateEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }
        
        return true;
    }

    validateBankTransfer() {
        if (!this.paymentData.bank) {
            showNotification('Please select a bank', 'error');
            return false;
        }
        
        const reference = document.getElementById('bank-reference')?.value;
        if (!reference) {
            showNotification('Please generate a reference number', 'error');
            return false;
        }
        
        return true;
    }

    validateCreditCard() {
        const cardNumber = document.getElementById('card-number')?.value.replace(/\s/g, '');
        const cardExpiry = document.getElementById('card-expiry')?.value;
        const cardCvc = document.getElementById('card-cvc')?.value;
        const cardName = document.getElementById('card-name')?.value;
        
        if (!this.validateCardNumber(cardNumber)) {
            showNotification('Invalid card number', 'error');
            return false;
        }
        
        if (!this.validateCardExpiry(cardExpiry)) {
            showNotification('Invalid expiry date', 'error');
            return false;
        }
        
        if (!cardCvc || cardCvc.length < 3) {
            showNotification('Invalid CVC', 'error');
            return false;
        }
        
        if (!cardName) {
            showNotification('Please enter cardholder name', 'error');
            return false;
        }
        
        return true;
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validateCardNumber(cardNumber) {
        // Simple Luhn algorithm check
        const cleaned = cardNumber.replace(/\D/g, '');
        
        if (cleaned.length < 13 || cleaned.length > 19) {
            return false;
        }
        
        let sum = 0;
        let isEven = false;
        
        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned.charAt(i));
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }

    validateCardExpiry(expiry) {
        const [month, year] = expiry.split('/');
        
        if (!month || !year) {
            return false;
        }
        
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        const expMonth = parseInt(month);
        const expYear = parseInt(year);
        
        if (expMonth < 1 || expMonth > 12) {
            return false;
        }
        
        if (expYear < currentYear) {
            return false;
        }
        
        if (expYear === currentYear && expMonth < currentMonth) {
            return false;
        }
        
        return true;
    }

    // UI Helpers
    updatePaymentSummary() {
        const amountElement = document.getElementById('payment-amount-display');
        if (amountElement) {
            amountElement.textContent = this.formatCurrency(this.amount, this.currency);
        }
        
        const feesElement = document.getElementById('payment-fees');
        if (feesElement) {
            const fees = this.calculateFees();
            feesElement.textContent = this.formatCurrency(fees, this.currency);
        }
        
        const totalElement = document.getElementById('payment-total');
        if (totalElement) {
            const total = this.amount + this.calculateFees();
            totalElement.textContent = this.formatCurrency(total, this.currency);
        }
    }

    calculateFees() {
        if (!this.selectedMethod || !this.paymentConfig[this.selectedMethod]) {
            return 0;
        }
        
        const methodConfig = this.paymentConfig[this.selectedMethod];
        const fees = methodConfig.fees || {};
        
        let totalFees = 0;
        
        if (fees.percentage) {
            totalFees += this.amount * (fees.percentage / 100);
        }
        
        if (fees.fixed) {
            totalFees += fees.fixed;
        }
        
        return totalFees;
    }

    formatCardNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        // Add spaces every 4 digits
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        
        // Limit to 19 characters (16 digits + 3 spaces)
        value = value.substring(0, 19);
        
        input.value = value;
        
        // Update card preview
        this.updateCardPreview('number', value);
        
        // Detect card type
        this.detectCardType(value);
    }

    formatCardExpiry(input) {
        let value = input.value.replace(/\D/g, '');
        
        // Format as MM/YY
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        
        input.value = value;
        
        // Update card preview
        this.updateCardPreview('expiry', value);
    }

    updateCardPreview(field, value) {
        const previewElement = document.querySelector('.card-preview');
        if (!previewElement) return;
        
        switch (field) {
            case 'number':
                const numberElement = previewElement.querySelector('.card-number');
                if (numberElement) {
                    numberElement.textContent = value || '•••• •••• •••• ••••';
                }
                break;
            case 'expiry':
                const expiryElement = previewElement.querySelector('.card-expiry');
                if (expiryElement) {
                    expiryElement.textContent = value || 'MM/YY';
                }
                break;
            case 'name':
                const nameElement = previewElement.querySelector('.card-holder-name');
                if (nameElement) {
                    nameElement.textContent = value || 'CARDHOLDER NAME';
                }
                break;
        }
    }

    detectCardType(cardNumber) {
        const cleaned = cardNumber.replace(/\D/g, '');
        let type = 'unknown';
        
        // Visa: starts with 4
        if (/^4/.test(cleaned)) {
            type = 'visa';
        }
        // MasterCard: starts with 51-55 or 2221-2720
        else if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
            type = 'mastercard';
        }
        // American Express: starts with 34 or 37
        else if (/^3[47]/.test(cleaned)) {
            type = 'amex';
        }
        
        // Update card logo
        this.updateCardLogo(type);
    }

    updateCardLogo(type) {
        const logos = document.querySelectorAll('.card-logo');
        logos.forEach(logo => {
            logo.classList.remove('active');
        });
        
        const activeLogo = document.querySelector(`.card-logo[data-type="${type}"]`);
        if (activeLogo) {
            activeLogo.classList.add('active');
        }
    }

    generateReferenceNumber() {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const reference = `ZEWED${timestamp.substr(-6)}${random}`;
        
        const refInput = document.getElementById('bank-reference');
        if (refInput) {
            refInput.value = reference;
        }
        
        // Copy to clipboard
        navigator.clipboard.writeText(reference)
            .then(() => showNotification('Reference number copied to clipboard', 'success'))
            .catch(() => showNotification('Reference number generated', 'info'));
    }

    // Payment Status
    showProcessing() {
        this.goToStep(3);
        
        // Simulate processing animation
        const processingElement = document.getElementById('payment-processing');
        if (processingElement) {
            processingElement.style.display = 'block';
            
            const dots = processingElement.querySelector('.processing-dots');
            if (dots) {
                let dotCount = 0;
                const interval = setInterval(() => {
                    dots.textContent = '.'.repeat((dotCount % 3) + 1);
                    dotCount++;
                }, 500);
                
                // Store interval for cleanup
                this.processingInterval = interval;
            }
        }
    }

    showPaymentSuccess(result) {
        // Clear processing animation
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        
        this.goToStep(4);
        
        // Update success details
        this.updateSuccessDetails(result);
        
        // Save transaction
        this.saveTransaction(result);
        
        // Track analytics
        this.trackPaymentSuccess(result);
    }

    showPaymentError(message) {
        // Clear processing animation
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        
        const errorElement = document.getElementById('payment-error');
        if (errorElement) {
            errorElement.style.display = 'block';
            
            const errorMessage = errorElement.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
        }
        
        // Track error
        this.trackPaymentError(message);
    }

    updateSuccessDetails(result) {
        const transactionId = document.getElementById('transaction-id');
        const paymentAmount = document.getElementById('success-amount');
        const paymentMethod = document.getElementById('success-method');
        const paymentDate = document.getElementById('success-date');
        
        if (transactionId) transactionId.textContent = result.transactionId || 'N/A';
        if (paymentAmount) paymentAmount.textContent = this.formatCurrency(result.amount, result.currency);
        if (paymentMethod) paymentMethod.textContent = this.getMethodName(result.method);
        if (paymentDate) paymentDate.textContent = new Date().toLocaleString();
    }

    getMethodName(method) {
        const methodNames = {
            'telebirr': 'Telebirr',
            'cbe-birr': 'CBE Birr',
            'chapa': 'Chapa',
            'bank-transfer': 'Bank Transfer',
            'credit-card': 'Credit Card',
            'paypal': 'PayPal'
        };
        
        return methodNames[method] || method;
    }

    // Transaction Management
    saveTransaction(result) {
        const transactions = JSON.parse(localStorage.getItem('payment_transactions') || '[]');
        
        const transaction = {
            id: result.transactionId || Date.now().toString(),
            amount: this.amount,
            currency: this.currency,
            method: this.selectedMethod,
            status: 'completed',
            date: new Date().toISOString(),
            details: result
        };
        
        transactions.push(transaction);
        localStorage.setItem('payment_transactions', JSON.stringify(transactions));
    }

    async checkPendingPayments() {
        const pending = localStorage.getItem('pending_payment');
        
        if (pending) {
            try {
                const paymentData = JSON.parse(pending);
                const response = await fetch(`/api/payments/verify/${paymentData.transactionId}`);
                
                if (response.ok) {
                    const result = await response.json();
                    
                    if (result.status === 'completed') {
                        this.showPaymentSuccess(result);
                    } else if (result.status === 'failed') {
                        this.showPaymentError('Payment verification failed');
                    }
                    
                    localStorage.removeItem('pending_payment');
                }
            } catch (error) {
                console.error('Error checking pending payment:', error);
            }
        }
    }

    cancelPayment() {
        if (confirm('Are you sure you want to cancel this payment?')) {
            window.location.href = '/';
        }
    }

    viewReceipt() {
        const receiptModal = document.getElementById('receipt-modal');
        if (receiptModal) {
            receiptModal.classList.add('active');
        }
    }

    downloadInvoice() {
        const invoiceContent = this.generateInvoice();
        const blob = new Blob([invoiceContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateInvoice() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>ZewedJobs Invoice</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .invoice { max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 40px; }
                    .details { margin-bottom: 30px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #f5f5f5; }
                    .total { font-weight: bold; font-size: 18px; }
                </style>
            </head>
            <body>
                <div class="invoice">
                    <div class="header">
                        <h1>ZewedJobs</h1>
                        <h2>Payment Invoice</h2>
                        <p>Date: ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="details">
                        <p><strong>Transaction ID:</strong> ${Date.now()}</p>
                        <p><strong>Payment Method:</strong> ${this.getMethodName(this.selectedMethod)}</p>
                        <p><strong>Status:</strong> Completed</p>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${this.paymentData.description || 'Service Payment'}</td>
                                <td>${this.formatCurrency(this.amount, this.currency)}</td>
                            </tr>
                            <tr>
                                <td>Transaction Fee</td>
                                <td>${this.formatCurrency(this.calculateFees(), this.currency)}</td>
                            </tr>
                            <tr class="total">
                                <td>Total</td>
                                <td>${this.formatCurrency(this.amount + this.calculateFees(), this.currency)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 40px; text-align: center;">
                        <p>Thank you for your payment!</p>
                        <p>ZewedJobs - Your Career Partner</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Analytics
    trackPaymentSuccess(result) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                transaction_id: result.transactionId,
                value: this.amount,
                currency: this.currency,
                payment_method: this.selectedMethod
            });
        }
        
        console.log('Payment successful:', result);
    }

    trackPaymentError(message) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'payment_error', {
                error_message: message,
                payment_method: this.selectedMethod
            });
        }
        
        console.error('Payment error:', message);
    }

    // Utility Methods
    formatCurrency(amount, currency = 'ETB') {
        const formatter = new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        });
        
        return formatter.format(amount);
    }

    // Public Methods
    setAmount(amount, currency = 'ETB') {
        this.amount = amount;
        this.currency = currency;
        this.updatePaymentSummary();
    }

    setDescription(description) {
        this.paymentData.description = description;
    }

    setPaymentData(data) {
        this.paymentData = { ...this.paymentData, ...data };
    }

    getSupportedMethods() {
        return this.paymentConfig;
    }
}

// Initialize Payment Manager
window.paymentManager = new PaymentManager();

// Global helper functions
window.processPayment = function(amount, description, method) {
    paymentManager.setAmount(amount);
    paymentManager.setDescription(description);
    
    if (method) {
        paymentManager.selectPaymentMethod(method);
    }
    
    openModal('payment-modal');
};

window.formatCurrency = function(amount, currency = 'ETB') {
    return paymentManager.formatCurrency(amount, currency);
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentManager;
}
