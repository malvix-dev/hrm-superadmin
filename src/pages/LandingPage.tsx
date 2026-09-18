import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, BedDouble, Receipt, BarChart3, Shield, Bell, CheckCircle2, ArrowRight, Menu, X, Star } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const features = [
  { icon: Users, title: "Tenant Management", desc: "Register, track, and manage all tenants with detailed profiles, documents, and payment history." },
  { icon: BedDouble, title: "Room & Bed Management", desc: "Manage rooms, beds, occupancy status, and assignments with visual dashboards." },
  { icon: Receipt, title: "Expense Tracking", desc: "Track all hostel expenses categorized by type with monthly summaries and reports." },
  { icon: Bell, title: "Rent Reminders", desc: "Automated overdue detection with one-click reminder sending to tenants." },
  { icon: Shield, title: "Security Deposits", desc: "Track deposits, deductions, and refund status per tenant with full audit trail." },
  { icon: BarChart3, title: "P&L Reports", desc: "Monthly income vs expenses with charts, tables, and net balance calculations." },
];

const testimonials = [
  { name: "Rajesh Kumar", role: "Hostel Owner, Delhi", text: "This platform transformed how I manage my 3 hostels. Everything is in one place now.", rating: 5 },
  { name: "Priya Sharma", role: "PG Manager, Bangalore", text: "Rent reminders alone saved me hours every month. The P&L reports are a game changer.", rating: 5 },
  { name: "Amit Patel", role: "Hostel Chain, Mumbai", text: "We moved from spreadsheets to this and never looked back. Highly recommended!", rating: 5 },
];

const faqs = [
  { q: "How do I get started with Hostel Manager?", a: "Simply sign up for a free account, add your hostel details, and start managing tenants and rooms right away. No credit card required for the Starter plan." },
  { q: "Can I manage multiple hostels from one account?", a: "Yes! Our Enterprise plan supports multi-property management. You can switch between hostels seamlessly from a single dashboard." },
  { q: "How does the rent reminder system work?", a: "The system automatically detects overdue payments based on tenant payment schedules and displays them in your dashboard. You can send reminders with one click via toast notifications, and WhatsApp integration is coming soon." },
  { q: "Is my data secure?", a: "Absolutely. We use industry-standard encryption, secure cloud infrastructure with 99.9% uptime, and regular backups to keep your data safe." },
  { q: "Can I export reports and data?", a: "Yes, you can export P&L reports, tenant lists, expense summaries, and more in various formats for your records or accountant." },
  { q: "What kind of support do you offer?", a: "Starter plans get email support, Professional plans get priority support, and Enterprise plans get a dedicated account manager along with phone and chat support." },
];

const LandingPage = () => {
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: "", email: "", phone: "", hostelName: "", message: "" });

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.name || !demoForm.email || !demoForm.phone) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    toast({ title: "Demo Request Submitted!", description: "Our team will contact you within 24 hours." });
    setDemoForm({ name: "", email: "", phone: "", hostelName: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">Hostel Manager</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Request Demo</a>
              <Link to="/login"><Button variant="outline" size="sm">Login</Button></Link>
              <Link to="/signup"><Button size="sm">Get Started</Button></Link>
            </nav>
            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#testimonials" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
            <a href="#pricing" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#demo" className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Request Demo</a>
            <div className="flex gap-2 pt-2">
              <Link to="/login" className="flex-1"><Button variant="outline" className="w-full" size="sm">Login</Button></Link>
              <Link to="/signup" className="flex-1"><Button className="w-full" size="sm">Get Started</Button></Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <CheckCircle2 className="w-4 h-4" /> Trusted by 500+ Hostel Managers
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            Manage Your Hostel <br className="hidden sm:block" />
            <span className="text-primary">Smarter & Faster</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            All-in-one platform to manage tenants, rooms, finances, and operations. 
            Say goodbye to spreadsheets and manual tracking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="#demo"><Button size="lg" className="w-full sm:w-auto gap-2">Request a Demo <ArrowRight className="w-4 h-4" /></Button></a>
            <Link to="/dashboard"><Button variant="outline" size="lg" className="w-full sm:w-auto">Explore Dashboard</Button></Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "500+", label: "Hostels Managed" },
            { value: "50K+", label: "Tenants Tracked" },
            { value: "₹2Cr+", label: "Rent Collected" },
            { value: "99.9%", label: "Uptime" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl md:text-3xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Everything You Need to Run Your Hostel</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Powerful features designed specifically for hostel and PG management.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="group hover:shadow-lg transition-shadow border-border">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">What Our Customers Say</h2>
            <p className="text-muted-foreground">Join hundreds of happy hostel managers.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">"{t.text}"</p>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { plan: "Starter", price: "Free", desc: "For small hostels", features: ["Up to 20 tenants", "Basic room management", "Expense tracking", "Email support"] },
              { plan: "Professional", price: "₹999/mo", desc: "For growing hostels", features: ["Up to 100 tenants", "All financial tools", "P&L reports", "Priority support"], popular: true },
              { plan: "Enterprise", price: "Custom", desc: "For hostel chains", features: ["Unlimited tenants", "Multi-property support", "Custom integrations", "Dedicated manager"] },
            ].map((p) => (
              <Card key={p.plan} className={`relative border-border ${p.popular ? "ring-2 ring-primary shadow-lg" : ""}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-foreground mb-1">{p.plan}</h3>
                  <p className="text-3xl font-bold text-foreground mb-1">{p.price}</p>
                  <p className="text-xs text-muted-foreground mb-6">{p.desc}</p>
                  <ul className="space-y-2 text-sm text-left mb-6">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <a href="#demo">
                    <Button variant={p.popular ? "default" : "outline"} className="w-full">
                      {p.price === "Custom" ? "Contact Us" : "Get Started"}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Request Form */}
      <section id="demo" className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Request a Free Demo</h2>
            <p className="text-muted-foreground">See how Hostel Manager can transform your operations. Our team will reach out within 24 hours.</p>
          </div>
          <Card className="border-border">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
                    <Input placeholder="John Doe" value={demoForm.name} onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
                    <Input type="email" placeholder="john@example.com" value={demoForm.email} onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number *</label>
                    <Input type="tel" placeholder="+91 98765 43210" value={demoForm.phone} onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Hostel Name</label>
                    <Input placeholder="My Hostel" value={demoForm.hostelName} onChange={(e) => setDemoForm({ ...demoForm, hostelName: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
                  <Textarea placeholder="Tell us about your hostel and requirements..." rows={4} value={demoForm.message} onChange={(e) => setDemoForm({ ...demoForm, message: e.target.value })} />
                </div>
                <Button type="submit" size="lg" className="w-full">Submit Demo Request</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Got questions? We've got answers.</p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-foreground">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">Hostel Manager</span>
              </div>
              <p className="text-sm text-muted-foreground">All-in-one hostel management platform for modern hostel owners.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#demo" className="hover:text-foreground">Request Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About Us</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            © 2026 Hostel Manager. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
