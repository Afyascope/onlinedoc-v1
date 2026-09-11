import React from 'react'

import { Inter, Montserrat } from 'next/font/google';
import { CartProvider } from '@/context/cart-context';
import { AuthProvider } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { ViewTransitions } from 'next-view-transitions';
import { Analytics } from '@vercel/analytics/react';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n/locale';
import SetLang from './SetLang';

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
    weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-montserrat",
    weight: ["500", "600", "700", "800"],
});

export default function LocaleLayout({
    children,
    params: { locale }
}: {
    children: React.ReactNode;
    params: { locale: string };
}) {
    // Static assets such as /icon.svg, /favicon.ico, /images/*, and /uploads/*
    // are excluded from the i18n middleware, so they can still reach this
    // dynamic [locale] segment. Reject any value that is not a configured
    // locale so those assets are never rendered as a locale route.
    if (!isValidLocale(locale)) {
        notFound();
    }

    return (
        <ViewTransitions>
            <CartProvider>
                <AuthProvider>
                <SetLang locale={locale} />
                <div
                    className={cn(
                        inter.variable,
                        montserrat.variable,
                        "bg-surface antialiased h-full w-full font-secondary text-[var(--color-text-primary)]"
                    )}
                >
                    {children}
                </div>
            </AuthProvider>
            </CartProvider>
            <Analytics />
        </ViewTransitions>
    );
}
