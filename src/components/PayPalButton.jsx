export default function PayPalButton({ amount, onSuccess }) {
  useEffect(() => {
    if (!amount || amount <= 0) return;

    const container = document.getElementById("paypal-dynamic-button");
    if (!container) return;

    container.innerHTML = "";

    window.paypal
      .Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: { value: amount.toFixed(2), currency_code: "EUR" },
                description: `Unlock ${Math.round(amount / 0.1)} extra rows`,
              },
            ],
          });
        },
        onApprove: (data, actions) => {
          return actions.order.capture().then(() => {
            onSuccess(Math.round(amount / 0.1));
          });
        },
        onError: () => alert("Payment failed. Try again."),
      })
      .render("#paypal-dynamic-button");
  }, [amount, onSuccess]);

  return (
    <div
      id="paypal-dynamic-button"
      style={{ minHeight: "55px", margin: "10px 0" }}
    />
  );
}
