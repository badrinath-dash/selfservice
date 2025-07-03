import * as React from "react";
import Box from '@splunk/react-ui/Box';
import Typography from '@splunk/react-ui/Typography';
import DL, { Term as DT, Description as DD } from '@splunk/react-ui/DefinitionList';

const products = [
  {
    name: "SPLUNK API Access",
    desc: "Estimated Total Cost",
    price: "$15.00"
  },
  {
    name: "Hardware Cost",
    desc: "Number of CPU Cores used",
    price: "Free"
  }
];

export default function Info({ totalPrice }) {
  return (
    <Box style={{ padding: '16px 0' }}>
      <Typography variant="title2" style={{ marginBottom: '4px' }}>
        Total
      </Typography>
      <Typography variant="title3" style={{ marginBottom: '16px' }}>
        {totalPrice}
      </Typography>

      <DL>
        {products.map((product) => (
          <React.Fragment key={product.name}>
            <DT>
              <Typography variant="body" weight="semibold">
                {product.name}
              </Typography>
            </DT>
            <DD>
              <Typography variant="body">{product.price}</Typography>
            </DD>
          </React.Fragment>
        ))}
      </DL>
    </Box>
  );
}
