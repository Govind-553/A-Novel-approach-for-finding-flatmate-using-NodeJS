function showModal() {
            const modal = document.getElementById('successModal');
            modal.style.display = 'flex';
        }

        function closeModal() {
            const modal = document.getElementById('successModal');
            modal.style.display = 'none';
        }

        async function initiatePayment(amount, planName) {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                let sessionFileName = urlParams.get('session');

                if (!sessionFileName) {
                     sessionFileName = document.getElementById('sessionFileName').value;
                }
                
                if (sessionFileName === '{{sessionFileName}}') {
                    sessionFileName = null;
                }

                if (!sessionFileName) {
                    alert('Session data is missing. Please restart registration.');
                    return;
                }

                // Call backend with specific plan details
                const response = await apiFetch('/create-checkout-session', {
                    method: 'POST',
                    body: JSON.stringify({ 
                        sessionFileName, 
                        amount: amount, 
                        planName: planName 
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    alert(`Error initializing payment: ${errorText}`);
                    return;
                }
                const data = await response.json();
                
                const options = {
                    key: data.key,
                    amount: data.amount,
                    currency: data.currency,
                    order_id: data.orderId,
                    name: "Flatmate Platform",
                    description: `Subscription: ${planName}`,
                    handler: function(response) {
                        console.log("Payment Success:", response);
                        window.location.href = `/complete?payment_id=${response.razorpay_payment_id}&order_id=${response.razorpay_order_id}`;
                    },
                    prefill: {
                        name: "Partner", 
                        email: "", 
                        contact: ""
                    },
                    theme: { 
                        color: "#6E57E0" 
                    },
                    modal: {
                        backdropclose: false,
                        escape: false
                    }
                };
                const rzp = new Razorpay(options);
                rzp.open();
                
            } catch (error) {
                console.error('Payment Error:', error);
                alert('Connection Error: ' + error.message);
            }
        }