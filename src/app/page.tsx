export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-heading text-primary mb-4">Suvarna GoldLoan ERP</h1>
      <p className="text-lg text-muted-foreground mb-8">Enterprise SaaS for Gold Loan Management</p>
      <div className="flex gap-4">
        <a href="/login" className="px-6 py-2 bg-primary text-primary-foreground rounded-md shadow-sm font-medium hover:opacity-90 transition">
          Login
        </a>
      </div>
    </div>
  );
}
