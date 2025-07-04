import * as React from "react"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemText from "@mui/material/ListItemText"
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
]

export default function Info({ totalPrice }) {
  return (
    <React.Fragment>

      <DefinitionList disablePadding>
        {products.map(product => (
          <ListItem key={product.name} sx={{ py: 1, px: 0 }}>
            <ListItemText
              sx={{ mr: 2 }}

              primary={
                <Typography sx={{ color: 'white', size:'24', weight:"bold",lineHeight:'1.47'}}>
                  {product.name}
                </Typography>
              }

              secondary={
                <Typography sx={{ color: 'active', size: 34, fontWeight: 'medium' }}>
                  {product.desc}
                </Typography>
              }
            />
            <Typography variant="body" weight="bold" size="1.5rem">
              {product.price}
            </Typography>
          </ListItem>
        ))}
      </DefinitionList>


    </React.Fragment>
  )
}
