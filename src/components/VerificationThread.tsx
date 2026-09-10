import React from "react";

const steps = [
  "Listed",
  "Documents Verified",
  "Shariah Certified",
  "Live for Investors",
];

export default function VerificationThread({ completed = 3 }: { completed?: number }) {
  return (
    <div className="verification-thread" aria-label="Vehicle verification status">
      {steps.map((step, index) => (
        <div key={step} className={`verification-step ${index < completed ? "is-complete" : ""}`}>
          <span className="verification-dot" />
          <span>{step}</span>
        </div>
      ))}
    </div>
  );
}