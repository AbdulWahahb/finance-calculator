import React, { useEffect, useMemo, useState } from "react";

interface Row {
  id: number;
  date: string;
  seller: string;
  quantity: number;
  price: number;
  andaz: number;
  karki: number;
  mobland: number;
  expenses: number;
}

interface SavedSet {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  rows: Row[];
  totals: {
    quantity: number;
    totalPrice: number;
    andaz: number;
    karki: number;
    mobland: number;
    exports: number;
    expenses: number;
  };
}

/** Format number to Persian locale with thousands separators and Persian digits */
function formatNumber(value: number) {
  return value.toLocaleString("fa-IR");
}

/** Convert Persian/Arabic-Indic digits to Latin digits */
function localizedDigitsToEnglish(s: string) {
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  return s
    .split("")
    .map((ch) => {
      const p = persian.indexOf(ch);
      if (p > -1) return String(p);
      const a = arabic.indexOf(ch);
      if (a > -1) return String(a);
      return ch;
    })
    .join("");
}

/** NumericInput: controlled numeric input that displays Persian digits + thousands separators.
 * value: numeric value (number)
 * onChange: called with numeric value (0 when empty)
 */
const NumericInput: React.FC<{
  value: number;
  onChange: (v: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
}> = ({ value, onChange, className = "", placeholder, min = 0 }) => {
  const [display, setDisplay] = useState<string>(() =>
    value === 0 ? "" : formatNumber(value)
  );

  useEffect(() => {
    setDisplay(value === 0 ? "" : formatNumber(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/[^\d\u06F0-\u06F9\u0660-\u0669]/g, "");
    if (digitsOnly === "") {
      setDisplay("");
      onChange(0);
      return;
    }
    const english = localizedDigitsToEnglish(digitsOnly);
    const num = Math.max(min, parseInt(english, 10) || 0);
    setDisplay(formatNumber(num));
    onChange(num);
  };

  const handleBlur = () => {
    if (display === "") {
      setDisplay("");
    }
  };

  return (
    <input
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={
        "w-full text-right px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition " +
        className
      }
    />
  );
};

function PurchaseSummery() {
  const [rows, setRows] = useState<Row[]>([
    {
      id: Date.now(),
      date: "",
      seller: "",
      quantity: 0,
      price: 0,
      andaz: 0,
      karki: 0,
      mobland: 0,
      expenses: 0,
    },
  ]);

  const [savedSets, setSavedSets] = useState<SavedSet[]>([]);

  // export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportName, setExportName] = useState("");
  const [exportDescription, setExportDescription] = useState("");
  const [modalVisibleCount, setModalVisibleCount] = useState(5); // "load more" pagination

  // saved-sets modal state (the new modal you requested)
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [savedModalVisibleCount, setSavedModalVisibleCount] = useState(8);

  // load saved sets & optionally last saved set on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sales_saved_sets");
      const parsed: SavedSet[] = raw ? JSON.parse(raw) : [];
      setSavedSets(parsed || []);
      const lastId = localStorage.getItem("sales_last_saved_id");
      if (lastId && parsed && parsed.length) {
        const last = parsed.find((s) => s.id === lastId);
        if (last) {
          setRows(last.rows.map((r) => ({ ...r })));
        }
      }
    } catch (err) {
      console.warn("failed to read saved sets", err);
    }
  }, []);

  const updateRow = <K extends keyof Row>(id: number, field: K, value: Row[K]) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        date: "",
        seller: "",
        quantity: 0,
        price: 0,
        andaz: 0,
        karki: 0,
        mobland: 0,
        expenses: 0,
      },
    ]);
  };

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.quantity += row.quantity;
        acc.totalPrice += row.quantity * row.price;
        acc.andaz += row.andaz;
        acc.karki += row.karki;
        acc.mobland += row.mobland;
        acc.exports += Math.max(0, row.quantity - row.karki);
        acc.expenses += row.expenses;
        return acc;
      },
      {
        quantity: 0,
        totalPrice: 0,
        andaz: 0,
        karki: 0,
        mobland: 0,
        exports: 0,
        expenses: 0,
      }
    );
  }, [rows]);
  const totalMoblandPercentage = getMoblandPercentage(
    totals.mobland,
    totals.quantity
  );

  // Save current rows + totals as a named saved set
  const persistSavedSets = (sets: SavedSet[]) => {
    try {
      localStorage.setItem("sales_saved_sets", JSON.stringify(sets));
    } catch (err) {
      console.warn("failed to persist saved sets", err);
    }
  };

  const saveCurrentSet = (nameInput?: string, descriptionInput?: string) => {
    const id = String(Date.now()) + "-" + Math.floor(Math.random() * 1000);
    const name =
      nameInput ||
      new Date().toLocaleString("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    const set: SavedSet = {
      id,
      name,
      description: descriptionInput ?? "",
      createdAt: new Date().toISOString(),
      rows: rows.map((r) => ({ ...r })),
      totals: totals,
    };
    const updated = [set, ...savedSets];
    setSavedSets(updated);
    persistSavedSets(updated);
    try {
      localStorage.setItem("sales_last_saved_id", id);
    } catch { }
    return set;
  };

  const handleSaveClick = () => {
    const promptName = prompt("نام برای مجموعه ذخیره شده وارد کنید:", "");
    const promptDesc = prompt("توضیح (اختیاری):", "") ?? "";
    const saved = saveCurrentSet(promptName ?? undefined, promptDesc);
    alert(`مجموعه '${saved.name}' ذخیره شد.`);
  };

  const restoreSavedSet = (id: string) => {
    const s = savedSets.find((x) => x.id === id);
    if (!s) {
      alert("مجموعه پیدا نشد.");
      return;
    }
    setRows(s.rows.map((r) => ({ ...r }))); // copy rows
    try {
      localStorage.setItem("sales_last_saved_id", id);
    } catch { }
    setSavedModalOpen(false); // close modal when loading
  };

  const deleteSavedSet = (id: string) => {
    if (!confirm("آیا مطمئن هستید که این مجموعه حذف شود؟")) return;
    const updated = savedSets.filter((s) => s.id !== id);
    setSavedSets(updated);
    persistSavedSets(updated);
    const lastId = localStorage.getItem("sales_last_saved_id");
    if (lastId === id) {
      localStorage.removeItem("sales_last_saved_id");
    }
  };

  // Print with a title (document.title used by many browsers as default PDF filename)
  const printWithTitle = (title: string, description?: string) => {
    const printWindow = window.open("", "_blank", "width=1000,height=700");
    if (!printWindow) {
      alert("باز شدن پنجره چاپ مسدود شد. لطفاً بلاکر پاپ‌آپ را غیرفعال کنید.");
      return;
    }

    const headers = [
      "تاریخ شمسی",
      "نام فروشنده",
      "تعداد",
      "قیمت",
      "مجموع قیمت",
      "انداز",
      "کرکی",
      "موبلند",
      "صادراتی",
      "مصارف",
    ];

    const escapeHtml = (s: string) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // const sortedRows = [...rows].sort((a, b) => b.price - a.price);
    const tableRowsHtml = rows
      .map((r) => {
        const totalPrice = (r.quantity ?? 0) * (r.price ?? 0);
        const exportsCount = Math.max(0, (r.quantity ?? 0) - (r.karki ?? 0));
        return `<tr>
          <td>${escapeHtml(r.date || "")}</td>
          <td>${escapeHtml(r.seller || "")}</td>
          <td style="text-align:right">${formatNumber(r.quantity ?? 0)}</td>
          <td style="text-align:right">${formatNumber(r.price ?? 0)}</td>
          <td style="text-align:right">${formatNumber(totalPrice)}</td>
          <td style="text-align:right">${formatNumber(r.andaz ?? 0)}</td>
          <td style="text-align:right">${formatNumber(r.karki ?? 0)}</td>
<td style="text-align:right">
  ${formatNumber(r.mobland ?? 0)}
  <div style="font-size:10px; color:#0891b2; margin-top:2px;">
    ${formatPercentage(
          getMoblandPercentage(r.mobland ?? 0, r.quantity ?? 0)
        )}
  </div>
</td>
          <td style="text-align:right">${formatNumber(exportsCount)}</td>
          <td style="text-align:right">${formatNumber(r.expenses ?? 0)}</td>
        </tr>`;
      })
      .join("");

    const totalsRowHtml = `<tr style="font-weight:bold; border-top:2px solid #333;">
      <td colspan="2" style="text-align:center">مجموع</td>
      <td style="text-align:right">${formatNumber(totals.quantity)}</td>
      <td style="text-align:right">-</td>
      <td style="text-align:right">${formatNumber(totals.totalPrice)}</td>
      <td style="text-align:right">${formatNumber(totals.andaz)}</td>
      <td style="text-align:right">${formatNumber(totals.karki)}</td>
<td style="text-align:right">
  ${formatNumber(totals.mobland)}
  <div style="font-size:10px; margin-top:2px;">
    ${formatPercentage(totalMoblandPercentage)}
  </div>
</td>
      <td style="text-align:right">${formatNumber(totals.exports)}</td>
      <td style="text-align:right">${formatNumber(totals.expenses)}</td>
    </tr>`;

    const style = `
      <style>
        @page { margin: 20mm; }
        body { font-family: Tahoma, "Helvetica Neue", Helvetica, Arial; direction: rtl; margin: 0; padding: 10px; }
        h2 { text-align: center; margin: 8px 0 12px; }
        p.desc { text-align: center; margin: 0 0 8px; color: #444; }
        table { width: 100%; border-collapse: collapse; direction: rtl; }
        th, td { border: 1px solid #333; padding: 6px 8px; font-size: 12px; }
        th { background: #fff; text-align: right; font-weight: bold; }
        td { text-align: left; }
        td[style*="text-align:right"] { text-align: right; }
      </style>
    `;

    const html = `
      <!doctype html>
      <html lang="fa" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(title)}</title>
          ${style}
        </head>
        <body>
          <h2>${escapeHtml(title)}</h2>
          ${description ? `<p class="desc">${escapeHtml(description)}</p>` : ""}
          <table>
            <thead>
              <tr>
                ${headers.map((h) => `<th>${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
              ${totalsRowHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      try {
        printWindow.print();
      } catch (err) {
        console.error("print failed", err);
      }
    }, 500);
  };

  // Open export modal (pre-fill name + description)
  const openExportModal = () => {
    const suggestedName = new Date().toLocaleString("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    setExportName(suggestedName);
    setExportDescription("");
    setModalVisibleCount(5);
    setExportModalOpen(true);
  };

  // Confirm export: save with provided name/desc and print with that title
  const confirmExport = () => {
    if (!exportName || exportName.trim() === "") {
      alert("لطفاً نام صادرات را وارد کنید.");
      return;
    }
    const saved = saveCurrentSet(exportName.trim(), exportDescription.trim());
    // print using saved name and description
    printWithTitle(saved.name, saved.description);
    setExportModalOpen(false);
  };

  // Modal: load more saved sets
  const loadMoreInModal = () => {
    setModalVisibleCount((c) => c + 5);
  };

  // Open saved-sets modal
  const openSavedModal = () => {
    setSavedModalVisibleCount(8);
    setSavedModalOpen(true);
  };

  const loadMoreSavedModal = () => {
    setSavedModalVisibleCount((c) => c + 8);
  };
  function getMoblandPercentage(mobland: number, quantity: number) {
    if (!quantity || quantity <= 0) return null;
    return (mobland / quantity) * 100;
  }

  function formatPercentage(value: number | null) {
    if (value === null) return "—";
    return `${value.toLocaleString("fa-IR", {
      maximumFractionDigits: 2,
    })}%`;
  }

  return (
    <div className="bg-slate-50 p-6" dir="rtl" lang="fa">
      <div className="max-w-full mx-auto bg-white rounded-2xl shadow-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold">مدیریت فروش</h1>

          <div className="w-full sm:w-auto flex gap-3">
            <button
              onClick={addRow}
              className="w-full sm:w-auto inline-flex items-center gap-2 bg-gradient-to-tr from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-lg shadow-sm transition"
            >
              + افزودن ردیف
            </button>

            <button
              onClick={handleSaveClick}
              className="w-full sm:w-auto inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-lg shadow-sm transition hover:shadow"
            >
              ذخیره
            </button>

            <button
              onClick={openExportModal}
              className="w-full sm:w-auto inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-lg shadow-sm transition hover:shadow"
            >
              چاپ / ذخیره و چاپ
            </button>

            {/* NEW: open saved-sets modal button */}
            <button
              onClick={openSavedModal}
              className="w-full sm:w-auto inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-800 px-4 py-2 rounded-lg shadow-sm transition hover:shadow"
            >
              مجموعه‌های ذخیره شده ({savedSets.length})
            </button>
          </div>
        </div>

        {/* Saved sets inline panel removed — replaced by modal opened above */}

        <div className="overflow-auto border border-slate-200 rounded-lg h-[600px] overflow-y-scroll">
          <table className="min-w-full w-full table-auto">
            <thead className="bg-slate-100 sticky top-0">
              <tr className="text-right">
                <th className="p-3 text-sm font-medium">Num</th>
                <th className="p-3 text-sm font-medium">تاریخ شمسی</th>
                <th className="p-3 text-sm font-medium">نام فروشنده</th>
                <th className="p-3 text-sm font-medium">تعداد</th>
                <th className="p-3 text-sm font-medium">قیمت</th>
                <th className="p-3 text-sm font-medium">مجموع قیمت</th>
                <th className="p-3 text-sm font-medium">انداز</th>
                <th className="p-3 text-sm font-medium">کرکی</th>
                <th className="p-3 text-sm font-medium">موبلند</th>
                <th className="p-3 text-sm font-medium">صادراتی</th>
                <th className="p-3 text-sm font-medium">مصارف</th>
                <th className="p-3 text-sm font-medium">عملیات</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, idx) => {
                const totalPrice = row.quantity * row.price;
                const exportsCount = Math.max(0, row.quantity - row.karki);

                return (
                  <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>

                    <td className="p-2">
                      <input
                        className="w-[70px] text-right px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition"
                        placeholder=" "
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={row.date}
                        onChange={(e) => updateRow(row.id, "date", e.target.value)}
                        className="w-full text-right px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                        placeholder="1402/01/01"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        value={row.seller}
                        onChange={(e) => updateRow(row.id, "seller", e.target.value)}
                        className="w-full text-right px-3 py-2 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition"
                        placeholder="نام فروشنده"
                      />
                    </td>

                    <td className="p-2">
                      <NumericInput
                        value={row.quantity}
                        onChange={(v) => updateRow(row.id, "quantity", v)}
                        className="bg-blue-50"
                        placeholder="تعداد"
                      />
                    </td>

                    <td className="p-2">
                      <NumericInput
                        value={row.price}
                        onChange={(v) => updateRow(row.id, "price", v)}
                        className="bg-amber-50"
                        placeholder="قیمت"
                      />
                    </td>

                    <td className="p-2 font-semibold text-right">{formatNumber(totalPrice)}</td>

                    <td className="p-2">
                      <NumericInput
                        value={row.andaz}
                        onChange={(v) => updateRow(row.id, "andaz", v)}
                        className="bg-violet-50"
                        placeholder="انداز"
                      />
                    </td>

                    <td className="p-2">
                      <NumericInput
                        value={row.karki}
                        onChange={(v) => updateRow(row.id, "karki", v)}
                        className="bg-emerald-50"
                        placeholder="کرکی"
                      />
                    </td>

                    <td className="p-2">
                      <div className="flex flex-col gap-1">
                        <NumericInput
                          value={row.mobland}
                          onChange={(v) => updateRow(row.id, "mobland", v)}
                          className="bg-cyan-50"
                          placeholder="موبلند"
                        />

                        <div className="text-xs text-cyan-700 text-center">
                          {formatPercentage(
                            getMoblandPercentage(row.mobland, row.quantity)
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-2 font-semibold text-green-600 text-right">
                      {formatNumber(exportsCount)}
                    </td>

                    <td className="p-2">
                      <NumericInput
                        value={row.expenses}
                        onChange={(v) => updateRow(row.id, "expenses", v)}
                        className="bg-red-50"
                        placeholder="مصارف"
                      />
                    </td>

                    <td className="p-2">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => removeRow(row.id)} className="text-sm text-red-600 hover:underline">
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Desktop summaries (kept for larger screens) */}
        <div className="hidden lg:grid grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <h3 className="text-sm text-slate-600">مجموع تعداد</h3>
            <p className="text-xl font-semibold">{formatNumber(totals.quantity)}</p>
          </div>

          <div className="p-4 rounded-xl bg-green-50 border border-green-100">
            <h3 className="text-sm text-slate-600">مجموع قیمت</h3>
            <p className="text-xl font-semibold">{formatNumber(totals.totalPrice)}</p>
          </div>

          <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100">
            <h3 className="text-sm text-slate-600">مجموع صادراتی</h3>
            <p className="text-xl font-semibold">{formatNumber(totals.exports)}</p>
          </div>

          <div className="p-4 rounded-xl bg-red-50 border border-red-100">
            <h3 className="text-sm text-slate-600">مجموع مصارف</h3>
            <p className="text-xl font-semibold">{formatNumber(totals.expenses)}</p>
          </div>
        </div>
      </div>

      {/* Sticky totals bar (full-width, single-line, always visible) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 py-3">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="text-sm text-slate-600">مجموع تعداد</div>
            <div className="px-3 py-2 rounded-md bg-blue-100 text-blue-800 font-semibold">{formatNumber(totals.quantity)}</div>

            <div className="text-sm text-slate-600">مجموع کرکی</div>
            <div className="px-3 py-2 rounded-md bg-emerald-100 text-emerald-800 font-semibold">{formatNumber(totals.karki)}</div>

            <div className="text-sm text-slate-600">مجموع انداز</div>
            <div className="px-3 py-2 rounded-md bg-violet-100 text-violet-800 font-semibold">{formatNumber(totals.andaz)}</div>

            <div className="text-sm text-slate-600">مجموع موبلند</div>

            <div className="px-3 py-2 rounded-md bg-cyan-100 text-cyan-800 font-semibold">
              <div>{formatNumber(totals.mobland)}</div>
              <div className="text-xs font-normal">
                {formatPercentage(totalMoblandPercentage)}
              </div>
            </div>

            <div className="text-sm text-slate-600">مجموع صادراتی</div>
            <div className="px-3 py-2 rounded-md bg-green-100 text-green-800 font-semibold">{formatNumber(totals.exports)}</div>

            <div className="text-sm text-slate-600">مجموع مصارف</div>
            <div className="px-3 py-2 rounded-md bg-red-100 text-red-800 font-semibold">{formatNumber(totals.expenses)}</div>
          </div>

          {/* Prominent total price */}
          <div className="flex items-center gap-3 pl-4">
            <div className="text-sm text-slate-600 whitespace-nowrap">مجموع قیمت</div>
            <div className="px-4 py-2 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white font-bold shadow-md">
              {formatNumber(totals.totalPrice)}
            </div>
          </div>
        </div>
      </div>

      {/* Export modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setExportModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl z-10 p-6">
            <h3 className="text-lg font-semibold mb-3">صادرات و چاپ</h3>

            <div className="grid grid-cols-1 gap-2 mb-4">
              <label className="text-sm">نام صادرات</label>
              <input
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="نام فایل PDF (برای ذخیره و عنوان)"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 mb-4">
              <label className="text-sm">توضیحات (اختیاری)</label>
              <textarea
                value={exportDescription}
                onChange={(e) => setExportDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                rows={3}
                placeholder="توضیحات مربوط به این صادرات..."
              />
            </div>


            <div className="flex justify-end gap-3">
              <button onClick={() => setExportModalOpen(false)} className="px-4 py-2 rounded bg-white border text-slate-700">انصراف</button>
              <button onClick={confirmExport} className="px-4 py-2 rounded bg-amber-400 text-white">  چاپ</button>
            </div>
          </div>
        </div>
      )}

      {/* Saved sets modal (NEW) */}
      {savedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSavedModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl z-10 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">مجموعه‌های ذخیره شده</h3>
              <button onClick={() => setSavedModalOpen(false)} className="text-sm px-3 py-1 bg-white border rounded">بستن</button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-3">
              {savedSets.length === 0 && <div className="text-sm text-slate-500">موردی ذخیره نشده است.</div>}

              {savedSets.slice(0, savedModalVisibleCount).map((s) => (
                <div key={s.id} className="border rounded p-3 bg-slate-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-right flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-md">{s.name}</div>
                          {s.description && <div className="text-sm text-slate-600 mt-1">{s.description}</div>}
                          <div className="text-xs text-slate-500 mt-1">{new Date(s.createdAt).toLocaleString("fa-IR")}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm text-slate-600">ردیف‌ها: <span className="font-semibold">{s.rows.length}</span></div>
                          <div className="text-sm text-slate-600">مجموع: <span className="font-semibold">{formatNumber(s.totals.totalPrice)}</span></div>
                        </div>
                      </div>

                      {/* optional small preview: first 3 rows */}
                      <div className="mt-3 text-xs text-slate-700">
                        {s.rows.slice(0, 3).map((r, i) => (
                          <div key={r.id} className="flex justify-between gap-2 py-0.5">
                            <div className="flex-1 truncate text-right">{r.seller || "—"}</div>
                            <div className="w-24 text-right">{formatNumber(r.quantity)}</div>
                            <div className="w-28 text-right">{formatNumber(r.price)}</div>
                          </div>
                        ))}
                        {s.rows.length > 3 && <div className="text-xs text-slate-500 mt-1">نمایش ۳ ردیف اول از {s.rows.length}</div>}
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch gap-2">
                      <button onClick={() => restoreSavedSet(s.id)} className="px-3 py-1 bg-blue-600 text-white rounded">بارگذاری</button>
                      <button onClick={() => { setExportName(s.name); setExportDescription(s.description ?? ""); setExportModalOpen(true); }} className="px-3 py-1 bg-amber-400 text-white rounded">صادرات</button>
                      <button onClick={() => deleteSavedSet(s.id)} className="px-3 py-1 bg-red-50 text-red-700 rounded">حذف</button>
                    </div>
                  </div>
                </div>
              ))}

              {savedModalVisibleCount < savedSets.length && (
                <div className="text-center">
                  <button onClick={loadMoreSavedModal} className="px-3 py-1 bg-white border rounded">بارگذاری بیشتر</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default PurchaseSummery
