import React from "react";
import UploadComponent from "./UploadComponent";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const initialOptions = {
  "client-id":
    "ASaQBXtfAA-5M_hPbFCBoIvS9DcxVPJDtxrnF3qruOwbWaQ8LpcwCNbVZeZOVdlpJu1GhHcZBSBp_PAp",
  currency: "EUR",
  intent: "capture",
};

function App() {
  return (
    <PayPalScriptProvider options={initialOptions}>
      <UploadComponent />
    </PayPalScriptProvider>
  );
}

export default App;
