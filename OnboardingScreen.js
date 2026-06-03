// OnboardingScreen.js — First-run tutorial for SINKPESO
//
// Shows when user has no data (empty wallets, expenses, incomes).
// Dismissible, stores "seen" flag in localStorage.
//
// Dependencies: React (global), Icon (global from index.html),
//   window.components.{Btn}, window.SINKPESO_CONSTANTS

(function () {
    "use strict";
    const e = React.createElement;
    const { Btn } = window.components;
    const LS_KEY = "sp_onboarding_seen";

    function OnboardingScreen({ onDismiss }) {
        const [step, setStep] = React.useState(0);

        const steps = [
            {
                icon: "wallet",
                iconColor: "#00E676",
                title: "Welcome to SINKPESO",
                body: "Your private, offline budget tracker. All your data stays on your device — no account, no cloud, no tracking.",
                accent: "#00E676"
            },
            {
                icon: "landmark",
                iconColor: "#3B82F6",
                title: "Create Wallets",
                body: "Start by adding your wallets — Cash, GCash, Maya, or bank accounts. Your balances are always derived from your transactions, so they never drift.",
                accent: "#3B82F6"
            },
            {
                icon: "receipt",
                iconColor: "#A855F7",
                title: "Track Everything",
                body: "Log income, expenses, and bills. Set budget limits per category. Watch your spending in real-time on the dashboard.",
                accent: "#A855F7"
            },
            {
                icon: "camera",
                iconColor: "#F59E0B",
                title: "Photo Diary",
                body: "Snap a photo of what you bought. Your spending story, visualized — not a spreadsheet.",
                accent: "#F59E0B"
            },
            {
                icon: "shield",
                iconColor: "#00E676",
                title: "Your Data, Your Device",
                body: "Export backups anytime. Set a PIN to lock the app. All data stored locally with IndexedDB for photos and archives.",
                accent: "#00E676"
            },
        ];

        const current = steps[step];
        const isLast = step === steps.length - 1;

        const handleNext = () => {
            if (isLast) {
                try { localStorage.setItem(LS_KEY, "1"); } catch (e) {}
                onDismiss();
            } else {
                setStep(s => s + 1);
            }
        };

        const handleSkip = () => {
            try { localStorage.setItem(LS_KEY, "1"); } catch (e) {}
            onDismiss();
        };

        return e('div', { className: "pin-screen", style: { background: "var(--bg-body)" } },
            // Progress dots
            e('div', { style: { display: "flex", gap: 8, marginBottom: 32 } },
                steps.map((_, i) => e('div', {
                    key: i,
                    role: "progressbar",
                    "aria-valuenow": step + 1,
                    "aria-valuemax": steps.length,
                    style: {
                        width: i === step ? 24 : 8, height: 8, borderRadius: 4,
                        background: i === step ? current.accent : "var(--border)",
                        transition: "all 0.3s"
                    }
                }))
            ),

            // Icon
            e('div', { style: { marginBottom: 24 } },
                e('div', { style: {
                    width: 80, height: 80, borderRadius: 20, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: current.accent + "18", border: "2px solid " + current.accent + "40"
                } },
                    e(window.Icon || function() { return null; }, { name: current.icon, size: 40, color: current.iconColor })
                )
            ),

            // Title
            e('h2', {
                style: { fontSize: 22, fontWeight: 800, color: "var(--text-main)", marginBottom: 12, textAlign: "center", lineHeight: 1.2 },
                "aria-live": "polite"
            }, current.title),

            // Body
            e('p', { style: { fontSize: 14, color: "var(--text-muted)", textAlign: "center", maxWidth: 320, lineHeight: 1.7, marginBottom: 40 } }, current.body),

            // Buttons
            e('div', { style: { display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 } },
                e(Btn, {
                    v: "accent",
                    onClick: handleNext,
                    style: { width: "100%", fontSize: 15, padding: "14px 0" },
                    "aria-label": isLast ? "Get started" : "Next"
                }, isLast ? "Get Started →" : "Next →"),
                !isLast && e('button', {
                    onClick: handleSkip,
                    style: {
                        background: "transparent", border: "none", color: "var(--text-muted)",
                        fontSize: 13, cursor: "pointer", padding: "8px", fontFamily: "inherit"
                    },
                    "aria-label": "Skip tutorial"
                }, "Skip Tutorial")
            )
        );
    }

    // Check if onboarding has been seen
    function shouldShowOnboarding() {
        try { return !localStorage.getItem(LS_KEY); } catch (e) { return true; }
    }

    window.OnboardingScreen = OnboardingScreen;
    window.shouldShowOnboarding = shouldShowOnboarding;
})();