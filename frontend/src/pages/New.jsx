import { useRef } from "react";

export function New() {
  const contactRef = useRef(null);

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Some top content */}
      <header className="p-4 bg-blue-500 text-white">
        <button onClick={scrollToContact} className="px-4 py-2 bg-white text-blue-500 rounded">
          Contact Us
        </button>
      </header>

      <main className="flex-grow p-4">
        <p>Your main content here...</p>
        <div className="h-[1000px]" /> {/* just to simulate scroll */}
      </main>

      {/* Footer */}
      <footer ref={contactRef} className="bg-gray-900 text-white p-6">
        <h2 className="text-xl font-bold">Contact Section</h2>
        <p>Email: contact@example.com</p>
      </footer>
    </div>
  );
}