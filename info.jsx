import * as React from "react";
import Typography from '@splunk/react-ui/Typography';
import DefinitionList, { Term, Description } from '@splunk/react-ui/DefinitionList';

const products = [
  {
    name: "Selected Service",
    desc: "SPLUNK API Access to Platform",
    price: "$15.00"
  },
  {
    name: "Dedicated support",
    desc: "Included in the Professional plan",
    price: "Free"
  },
  {
    name: "Hardware Cost",
    desc: "Devices needed for development",
    price: "$69.99"
  },
  {
    name: "Computing Cost",
    desc: "License",
    price: "$49.99"
  },
  {
    name: "Total Estimated Cost",
    desc: "Total Cost",
    price: "$15049.99"
  }
];

export default function Info() {
  return (
    <DefinitionList>
      {products.map((product) => (
        <React.Fragment key={product.name}>
          <Term>
            <Typography variant="body" weight="bold">
              {product.name}
            </Typography>
            <Typography variant="body" color="secondary">
              {product.desc}
            </Typography>
          </Term>
          <Description>
            <Typography variant="body" weight="bold">
              {product.price}
            </Typography>
          </Description>
        </React.Fragment>
      ))}
    </DefinitionList>
  );
}
