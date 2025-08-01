import React, { useMemo, useEffect, useState } from "react";
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import Typography from '@splunk/react-ui/Typography';

export default function Info({ applicationFormData, onTotalCostChange }) {
  const standardRestQueryUnitCost = 3.5;
  const serviceCost = 1000;
  const dedicatedSupportCost = 100;
  const standardAPIRequestCost = 500;
  const nonStandardAPIRequestCost = 1000;

  const products = useMemo(() => {
    const items = [
      {
        name: "Selected Service",
        desc: "Product Cost, SPLUNK API Access to Platform",
        price: serviceCost,
      },
      {
        name: "Dedicated support",
        desc: "Support required on-going basis for maintaining the integration i.e. token re-generation/ adhoc support etc.",
        price: dedicatedSupportCost,
      },
    ];

    if (applicationFormData.restQueryFrequency && Number(applicationFormData.restQueryFrequency) > 0) {
      const freq = Number(applicationFormData.restQueryFrequency);
      items.push({
        name: "Compute needed on daily basis",
        desc: `Compute needed on daily basis for total no of ${Math.floor(1440 / freq)} execution`,
        price: (1440 / freq) * standardRestQueryUnitCost,
      });
    }

    if (applicationFormData.standardAPIRequestType === 'Yes') {
      items.push({
        name: "Standard API Access",
        desc: "Standard API Service Provisioning cost",
        price: standardAPIRequestCost,
      });
    }

    if (applicationFormData.nonStandardAPIRequestType === 'Yes') {
      items.push({
        name: "Non-Standard API Access",
        desc: "Non Standard, Custom Query Review by Splunk team and optimize the query",
        price: nonStandardAPIRequestCost,
      });
    }

    return items;
  }, [
    applicationFormData.restQueryFrequency,
    applicationFormData.standardAPIRequestType,
    applicationFormData.nonStandardAPIRequestType
  ]);

  const totalCost = useMemo(
    () => products.reduce((sum, item) => sum + item.price, 0),
    [products]
  );

  // EFFECT: inform parent of new total cost
  useEffect(() => {
    if (typeof onTotalCostChange === 'function') {
      onTotalCostChange(totalCost);
    }
  }, [totalCost, onTotalCostChange]);

  // Add simple effect state for animation
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 500);
    return () => clearTimeout(timer);
  }, [totalCost]);

  return (
    <ColumnLayout columns={1}>
      <ColumnLayout.Row>
        <ColumnLayout.Column span={1}>
          <Typography
            color="active"
            weight="bold"
            lineHeight="comfortable"
            variant="title4"
            size="18"
          >
            Approximate Cost Estimate for Selected Service
          </Typography>
        </ColumnLayout.Column>
      </ColumnLayout.Row>

      {products.map((product) => (
        <ColumnLayout.Row key={product.name}>
          <ColumnLayout.Column span={2}>
            <Typography color="active" weight="bold" variant="title4">
              {product.name}
            </Typography>
            <Typography color="disabled" variant="body">
              {product.desc}
            </Typography>
          </ColumnLayout.Column>
          <ColumnLayout.Column span={1}>
            <Typography variant="title4" weight="bold">
              ${product.price.toFixed(2)}
            </Typography>
          </ColumnLayout.Column>
        </ColumnLayout.Row>
      ))}

      <ColumnLayout.Row>
        <ColumnLayout.Column span={2}>
          <Typography
            color="active"
            weight="bold"
            lineHeight="comfortable"
            variant="title4"
            size="18"
          >
            Estimated Total Cost
          </Typography>
        </ColumnLayout.Column>
        <ColumnLayout.Column span={1}>
          <Typography
            variant="title4"
            weight="bold"
            style={{
              transition: 'transform 0.5s ease, color 0.5s ease',
              color: animate ? '#0073e6' : 'inherit',
              transform: animate ? 'scale(1.2)' : 'scale(1)',
            }}
          >
            ${totalCost.toFixed(2)}
          </Typography>
        </ColumnLayout.Column>
      </ColumnLayout.Row>
    </ColumnLayout>
  );
}
