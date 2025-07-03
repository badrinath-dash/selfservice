import * as React from "react";
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
    <DL>
      <Typography variant="title2">Total</Typography>
      <Typography variant="title4">{totalPrice}</Typography>
      
        {products.map(product => (
          <React.Fragment key={product.name}>
            <DT>
              <Typography variant="title2">
                {product.name} 
                {/* {product.desc} */}
              </Typography>
            </DT>
            <DD>
              <Typography variant="title1" size={16}>
                {product.price}
              </Typography>
            </DD>
          </React.Fragment>
        ))}
      
    </DL>
  );
}
