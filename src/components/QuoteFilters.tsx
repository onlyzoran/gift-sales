"use client";

import { InputNumber, Select, Space } from "antd";

export type QuoteFilterValues = {
  brand: string;
  region?: string;
  faceValue?: number;
};

type QuoteFiltersProps = {
  brandOptions: { value: string; label: string }[];
  regionOptions: { value: string; label: string }[];
  faceValueOptions: { value: number; label: string }[];
  values: QuoteFilterValues;
  onChange: (values: QuoteFilterValues) => void;
};

export function QuoteFilters({
  brandOptions,
  regionOptions,
  faceValueOptions,
  values,
  onChange,
}: QuoteFiltersProps) {
  return (
    <div className="quote-filters">
      <Space wrap size="middle">
        <Space size="small">
          <span>Бренд</span>
          <Select
            value={values.brand}
            options={brandOptions}
            style={{ minWidth: 140 }}
            onChange={(brand) => onChange({ brand, region: undefined, faceValue: undefined })}
          />
        </Space>
        <Space size="small">
          <span>Регион</span>
          <Select
            allowClear
            placeholder="Все"
            value={values.region}
            options={regionOptions}
            style={{ minWidth: 160 }}
            onChange={(region) =>
              onChange({
                ...values,
                region: region ?? undefined,
              })
            }
          />
        </Space>
        <Space size="small">
          <span>Номинал</span>
          <Select
            allowClear
            placeholder="Все"
            value={values.faceValue}
            options={faceValueOptions}
            style={{ minWidth: 120 }}
            onChange={(faceValue) =>
              onChange({
                ...values,
                faceValue: faceValue ?? undefined,
              })
            }
          />
        </Space>
        <Space size="small">
          <span>или</span>
          <InputNumber
            min={1}
            placeholder="Точный номинал"
            value={values.faceValue}
            style={{ width: 140 }}
            onChange={(value) =>
              onChange({
                ...values,
                faceValue: value ?? undefined,
              })
            }
          />
        </Space>
      </Space>
    </div>
  );
}
