const fs = require('fs');
const path = require('path');

const base = __dirname;

const dirs = [
    "app",
    "app/providers",
    "app/router",
    "features",
    "features/pos",
    "features/pos/components",
    "features/pos/hooks",
    "features/pos/api",
    "features/pos/types",
    "features/inventory",
    "features/inventory/components",
    "features/kardex",
    "features/cash-shift",
    "features/customers",
    "features/reports",
    "features/settings",
    "shared",
    "shared/ui",
    "shared/hooks",
    "shared/lib",
    "shared/types",
    "styles"
];

for (const dir of dirs) {
    const dirPath = path.join(base, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

const moves = [
    ["components/POSView.tsx", "features/pos/POSView.tsx"],
    ["components/SplitPaymentModal.tsx", "features/pos/components/SplitPaymentModal.tsx"],
    ["components/SuspendedSalesModal.tsx", "features/pos/components/SuspendedSalesModal.tsx"],
    ["components/TicketPreviewModal.tsx", "features/pos/components/TicketPreviewModal.tsx"],
    ["components/SaleModal.tsx", "features/pos/components/SaleModal.tsx"],
    ["components/ProductTable.tsx", "features/inventory/components/ProductTable.tsx"],
    ["components/AddProductModal.tsx", "features/inventory/components/AddProductModal.tsx"],
    ["components/BarcodeGeneratorModal.tsx", "features/inventory/components/BarcodeGeneratorModal.tsx"],
    ["components/StockAdjustmentModal.tsx", "features/inventory/components/StockAdjustmentModal.tsx"],
    ["components/CashShiftView.tsx", "features/cash-shift/CashShiftView.tsx"],
    ["components/CustomersView.tsx", "features/customers/CustomersView.tsx"],
    ["components/KardexView.tsx", "features/kardex/KardexView.tsx"],
    ["components/ReportsView.tsx", "features/reports/ReportsView.tsx"],
    ["components/SettingsGrid.tsx", "features/settings/SettingsGrid.tsx"],
    ["components/DashboardLayout.tsx", "app/DashboardLayout.tsx"],
    ["components/NavigationTabs.tsx", "app/NavigationTabs.tsx"],
    ["components/Versions.tsx", "shared/ui/Versions.tsx"],
    ["types/pos.ts", "shared/types/domain.ts"],
    ["assets/main.css", "styles/main.css"]
];

for (const [src, dst] of moves) {
    const srcPath = path.join(base, src);
    const dstPath = path.join(base, dst);
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, dstPath);
        fs.unlinkSync(srcPath);
        console.log(`Moved ${src} to ${dst}`);
    }
}
