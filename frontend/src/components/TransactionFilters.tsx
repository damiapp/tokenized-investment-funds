import React, { useState, useEffect } from "react";
import { TransactionFilters as FilterType } from "../api/transactions";
import { fundsApi, type Fund } from "../api/funds";

interface TransactionFiltersProps {
  filters: FilterType;
  onFilterChange: (filters: Partial<FilterType>) => void;
}

export function TransactionFilters({ filters, onFilterChange }: TransactionFiltersProps) {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [localFilters, setLocalFilters] = useState<Partial<FilterType>>({});

  useEffect(() => {
    fetchFunds();
  }, []);

  const fetchFunds = async () => {
    try {
      const response = await fundsApi.getAll({});
      setFunds(response.data.funds);
    } catch (err) {
      console.error("Failed to fetch funds:", err);
    }
  };

  const handleStatusChange = (status: string) => {
    const currentStatuses = Array.isArray(localFilters.status)
      ? localFilters.status
      : localFilters.status
      ? [localFilters.status]
      : [];

    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    setLocalFilters({ ...localFilters, status: newStatuses });
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onFilterChange({
      status: undefined,
      fundId: undefined,
      startDate: undefined,
      endDate: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      search: undefined,
    });
  };

  const isStatusSelected = (status: string) => {
    const currentStatuses = Array.isArray(localFilters.status)
      ? localFilters.status
      : localFilters.status
      ? [localFilters.status]
      : [];
    return currentStatuses.includes(status);
  };

  const setQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    setLocalFilters({
      ...localFilters,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
  };

  return (
    <div
      style={{
        backgroundColor: "#2d2d2d",
        border: "1px solid #3e3e42",
        borderRadius: 8,
        padding: 20,
        height: "fit-content",
      }}
    >
      <h3 style={{ color: "#ffffff", fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
        Filters
      </h3>

      {/* Status Filter */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ color: "#cccccc", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
          Status
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["confirmed", "pending", "cancelled"].map((status) => (
            <label
              key={status}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                color: "#cccccc",
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={isStatusSelected(status)}
                onChange={() => handleStatusChange(status)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ textTransform: "capitalize" }}>{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Fund Filter */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ color: "#cccccc", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
          Fund
        </label>
        <select
          value={localFilters.fundId || ""}
          onChange={(e) => setLocalFilters({ ...localFilters, fundId: e.target.value || undefined })}
          style={{
            width: "100%",
            backgroundColor: "#3a3a3a",
            border: "1px solid #3e3e42",
            borderRadius: 4,
            color: "#ffffff",
            padding: "8px 12px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <option value="">All Funds</option>
          {funds.map((fund) => (
            <option key={fund.id} value={fund.id}>
              {fund.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Filter */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ color: "#cccccc", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
          Date Range
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          <input
            type="date"
            value={localFilters.startDate || ""}
            onChange={(e) => setLocalFilters({ ...localFilters, startDate: e.target.value || undefined })}
            placeholder="Start Date"
            style={{
              backgroundColor: "#3a3a3a",
              border: "1px solid #3e3e42",
              borderRadius: 4,
              color: "#ffffff",
              padding: "8px 12px",
              fontSize: 13,
            }}
          />
          <input
            type="date"
            value={localFilters.endDate || ""}
            onChange={(e) => setLocalFilters({ ...localFilters, endDate: e.target.value || undefined })}
            placeholder="End Date"
            style={{
              backgroundColor: "#3a3a3a",
              border: "1px solid #3e3e42",
              borderRadius: 4,
              color: "#ffffff",
              padding: "8px 12px",
              fontSize: 13,
            }}
          />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {[
            { label: "Today", days: 0 },
            { label: "7 days", days: 7 },
            { label: "30 days", days: 30 },
            { label: "90 days", days: 90 },
          ].map((range) => (
            <button
              key={range.label}
              onClick={() => setQuickDateRange(range.days)}
              style={{
                backgroundColor: "#3a3a3a",
                border: "1px solid #3e3e42",
                borderRadius: 4,
                color: "#cccccc",
                padding: "4px 8px",
                fontSize: 11,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#0078d4";
                e.currentTarget.style.borderColor = "#0078d4";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#3a3a3a";
                e.currentTarget.style.borderColor = "#3e3e42";
                e.currentTarget.style.color = "#cccccc";
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount Range Filter */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ color: "#cccccc", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
          Amount Range
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            type="number"
            value={localFilters.minAmount || ""}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder="Min Amount"
            style={{
              backgroundColor: "#3a3a3a",
              border: "1px solid #3e3e42",
              borderRadius: 4,
              color: "#ffffff",
              padding: "8px 12px",
              fontSize: 13,
            }}
          />
          <input
            type="number"
            value={localFilters.maxAmount || ""}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder="Max Amount"
            style={{
              backgroundColor: "#3a3a3a",
              border: "1px solid #3e3e42",
              borderRadius: 4,
              color: "#ffffff",
              padding: "8px 12px",
              fontSize: 13,
            }}
          />
        </div>
      </div>

      {/* Search Filter */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ color: "#cccccc", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>
          Search
        </label>
        <input
          type="text"
          value={localFilters.search || ""}
          onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value || undefined })}
          placeholder="ID, fund, email..."
          style={{
            width: "100%",
            backgroundColor: "#3a3a3a",
            border: "1px solid #3e3e42",
            borderRadius: 4,
            color: "#ffffff",
            padding: "8px 12px",
            fontSize: 13,
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={handleApplyFilters}
          style={{
            width: "100%",
            backgroundColor: "#0078d4",
            border: "none",
            borderRadius: 4,
            color: "#ffffff",
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#106ebe")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0078d4")}
        >
          Apply Filters
        </button>
        <button
          onClick={handleClearFilters}
          style={{
            width: "100%",
            backgroundColor: "#3a3a3a",
            border: "1px solid #3e3e42",
            borderRadius: 4,
            color: "#ffffff",
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e81123";
            e.currentTarget.style.borderColor = "#e81123";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#3a3a3a";
            e.currentTarget.style.borderColor = "#3e3e42";
          }}
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
