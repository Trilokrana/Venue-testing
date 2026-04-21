import { Facebook, Instagram, Youtube } from "lucide-react"
import Link from "next/link"

const footerSections = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/" },
      { label: "Blog", href: "/" },
      { label: "Careers", href: "/" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Listings", href: "/listings" },
      { label: "Connect Calendar", href: "/connect-calendar" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/" },
      { label: "Trust & Safety", href: "/" },
      { label: "Contact", href: "/" },
    ],
  },
]

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com", icon: Instagram },
  { label: "Facebook", href: "https://www.facebook.com", icon: Facebook },
  { label: "Youtube", href: "https://www.youtube.com", icon: Youtube },
]

export function GlobalFooter() {
  return (
    <footer className="border-t border-primary/20 bg-footer text-footer-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 border-b border-primary/15 pb-8 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Venue Compass</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Book premium spaces for events, productions, and private gatherings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {socialLinks.map((social) => {
              const Icon = social.icon
              return (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-primary/20 p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  aria-label={social.label}
                >
                  <Icon className="size-4" />
                </Link>
              )
            })}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          {footerSections.map((section) => (
            <section key={section.title}>
              <h3 className="mb-3 text-sm font-semibold tracking-wide text-foreground">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 border-t border-primary/15 pt-5 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Venue Compass. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
