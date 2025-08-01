import * as React from "react";
import ColumnLayout from '@splunk/react-ui/ColumnLayout';
import Typography from '@splunk/react-ui/Typography';

export default function Info({ applicationFormData, setApplicationFormData }) {

  let standardRestQueryUnitCost = 3.5;
  let serviceCost = 1000;
  let dedicatedSupportCost = 100;
  let standardAPIRequestCost = 500;
  let nonStandardAPIRequestCost = 1000;

  const products = [
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

  // Add conditional costs
  if (applicationFormData.restQueryFrequency) {
    products.push({
      name: "Compute needed on daily basis",
      desc: `Compute needed on daily basis for total no of ${1440 / applicationFormData.restQueryFrequency} execution`,
      price: 1440 / applicationFormData.restQueryFrequency * standardRestQueryUnitCost,
    });
  }

  if (applicationFormData.standardAPIRequestType === 'Yes') {
    products.push({
      name: "Standard API Access",
      desc: "Standard API Service Provisioning cost",
      price: standardAPIRequestCost,
    });
  }

  if (applicationFormData.nonStandardAPIRequestType === 'Yes') {
    products.push({
      name: "Non-Standard API Access",
      desc: "Non Standard, Custom Query Review by Splunk team and optimize the query",
      price: nonStandardAPIRequestCost,
    });
  }



  const totalCost = products.reduce((sum, item) => sum + item.price, 0);




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
          <Typography variant="title4" weight="bold"
          style={{
              transition: 'all 0.5s ease',
              color: totalCost ? '#0073e6' : 'inherit',
              transform: totalCost ? 'scale(1.1)' : 'scale(1)',
            }}>
            ${totalCost.toFixed(2)}
          </Typography>
        </ColumnLayout.Column>
      </ColumnLayout.Row>
    </ColumnLayout>
  );
}
