import React from 'react'

import { Inter, Montserrat } from 'next/font/google';
import { CartProvider } from '@/context/cart-context';
import { AuthProvider } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { ViewTransitions } from 'next-view-transitions';
import { Analytics } from '@vercel/analytics/react';
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
