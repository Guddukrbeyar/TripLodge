async function payFees(amount, listingId, listingTitle, location, userEmail) 
{
  try {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(userEmail)) {
      alert("Please enter a valid email before payment.");
      return;
    }

    console.log("Starting payment for:", listingTitle, "Amount:", amount);

    // Step 1: Create Razorpay order from backend
    const response = await fetch("/payment/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amount,
        listingId: listingId
      })
    });

    const data = await response.json();

    if (!data.success) {
      alert("❌ Could not create Razorpay order");
      return;
    }

    console.log("Order created successfully:", data);


    // Step 2: Razorpay configuration
    const options = {
      key: data.key_id,
      amount: data.amount,
      currency: data.currency,
      name: "Wanderlust",
      description: "Booking Payment for " + listingTitle,
      order_id: data.order_id,

      handler: async function (response) {
        console.log("✅ Razorpay Success:", response);

        // Step 3: Send email
        const emailResponse = await fetch("/payment/payment-success", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: userEmail,
            paymentId: response.razorpay_payment_id,
            title: listingTitle,
            amount: amount,
            location: location
          })
        });

        const emailResult = await emailResponse.json();

        if (emailResult.success) {
          alert("✅ Payment successful! Receipt sent to your email.");
        } else {
          alert("⚠ Payment done but email failed.");
        }

        window.location.href = "/listings/" + listingId;
      },

      prefill: {
        name: "Wanderlust User",
        email: userEmail,
        contact: ""
      },

      config: {
        display: {
          hide_email: false,
          hide_contact: false
        }
      },

      theme: {
        color: "#FF385C"
      }
    };

    const razorpay = new Razorpay(options);
    razorpay.open();

  } catch (error) {
    console.error("❌ Payment script error:", error);
    alert("❌ Something went wrong during payment.");
  }
}

