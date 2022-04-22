import React, { useEffect, useState } from 'react';
import {
  Box,
  Text,
  useColorMode,
  Table,
  Tr,
  Th,
  Td,
  Thead,
  Tbody,
  TableCaption,
} from '@chakra-ui/react';
import { useTable, useSortBy, usePagination } from "react-table"
import { useGlobalState } from 'state-pool'
import { getSerumMarket } from '@optifi/optifi-sdk/lib/utils/serum';
import { PublicKey } from '@solana/web3.js';
import { OptifiMarket } from '@optifi/optifi-sdk/lib/types/optifi-exchange-types';
const price = require('crypto-price')

function toFixed(x: any) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split('e-')[1]);
    if (e) {
        x *= Math.pow(10,e-1);
        x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split('+')[1]);
    if (e > 20) {
        e -= 20;
        x /= Math.pow(10,e);
        x += (new Array(e+1)).join('0');
    }
  }
  return x;
}

function OptionChain() {
  const { colorMode } = useColorMode();
  const [context] = useGlobalState('context');
  const [optifiMarkets] = useGlobalState('optifiMarkets');
  const [callChainData, setCallChainData] = useState<any[]>([]);
  const [putChainData, setPutChainData] = useState<any[]>([]);
  const [futureChainData, setFutureChainData] = useState<any[]>([]);
  const [currentInstrument, setCurrentInstrument] = useState(null)
  const [isOpen, setOpen] = useState(false);
  const [btcPrice, setBTCPrice] = useState(0);
  const [ethPrice, setETHPrice] = useState(0);
  const [readyForOrderbook, setReadyForOrderbook] = useGlobalState("readyForOrderbook");

  const onModalButtonClick = () => {
    setOpen(!isOpen)
  }

  const openPlaceOrderModal = (instrument: any) => {
    setCurrentInstrument(instrument);
    setOpen(true);
  }

  const columns = React.useMemo(
    () => [
      /* {
        Header: "Last",
        accessor: "last",
      },
      */
      {
        Header: "Instrument",
        accessor: "name",
      },
      {
        Header: "Size",
        accessor: "size",
        isNumeric: true,
      },
      /* {
        Header: "IV",
        accessor: "iv",
        isNumeric: true,
      }, */
      {
        Header: "Bid",
        accessor: "bid",
        isNumeric: true,
      },
      {
        Header: "Ask",
        accessor: "ask",
        isNumeric: true,
      },
      /* {
        Header: "IV",
        accessor: "iv2",
        isNumeric: true,
      }, */
      {
        Header: "Size",
        accessor: "askSize",
        isNumeric: true,
      },
      /* {
        Header: "Vol",
        accessor: "vol",
        isNumeric: true,
      },
      {
        Header: "Delta",
        accessor: "delta",
        isNumeric: true,
      },
 */      {
        Header: "Strike",
        accessor: "strike"
      },
    ],
    [],
  )

  const putColumns = React.useMemo(
    () => [
      /* {
        Header: "Last",
        accessor: "last",
      },
 */      
      {
        Header: "Instrument",
        accessor: "name",
      },
      {
        Header: "Size",
        accessor: "size",
        isNumeric: true,
      },
      /* {
        Header: "IV",
        accessor: "iv",
        isNumeric: true,
      }, */
      {
        Header: "Bid",
        accessor: "bid",
        isNumeric: true,
      },
      {
        Header: "Ask",
        accessor: "ask",
        isNumeric: true,
      },
      /* {
        Header: "IV",
        accessor: "iv2",
        isNumeric: true,
      }, */
      {
        Header: "Size",
        accessor: "askSize",
        isNumeric: true,
      },
      /* {
        Header: "Vol",
        accessor: "vol",
        isNumeric: true,
      },
      {
        Header: "Delta",
        accessor: "delta",
        isNumeric: true,
      },
 */ 
    ],
    [],
  )

  const getChain = async (first: boolean) => {
    const tempCall: any = [];
    const tempPut: any = [];
    const tempFuture: any = [];
    Promise.all([await price.getCryptoPrice('USD', "ETH"), await price.getCryptoPrice('USD', "BTC")])
    .then(([eth, btc])=> {
      setETHPrice(parseFloat(eth.price));
      setBTCPrice(parseFloat(btc.price))
      optifiMarkets.forEach(function(obj: any,index: any,collection: any) {
        setTimeout(async function(){
          await chainRequest(obj[0], obj[1], parseFloat(eth.price), parseFloat(btc.price), first,  tempCall, tempPut, tempFuture)
          if(index === optifiMarkets.length - 5) setReadyForOrderbook(true);     
          if(index + 1 === optifiMarkets.length && !first) {
            setTimeout(() => {
              setPutChainData(tempPut);
              setCallChainData(tempCall)
            }, 500)
          }
        }, 1200 * (index + 1));
      });
    })
    .catch((err:any)=> {
      console.log(err)
    })
  }


  async function chainRequest(optifiMarket: OptifiMarket, optifiMarketAddress: PublicKey, ethPrice: number, btcPrice: number, first: boolean, tempCall: any, tempPut: any, tempFuture: any) {
    return new Promise(async (resolve, reject) => {
      const inst = await context.program.account.chain.fetch(optifiMarket.instrument)
      const market = await getSerumMarket(context, optifiMarket.serumMarket);
      Promise.all([await market.loadAsks(context.connection),await market.loadBids(context.connection)])
      .then(([asks,bids])=> {
        const instrumentType = Object.keys(inst.instrumentType)[0];
        const asset = Object.keys(inst.asset)[0];
        const timeInSeconds = Math.floor(parseInt(inst.expiryDate.toString()) * 1000);
        const date = new Date(timeInSeconds);
        const dateFormatted = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
     
        let row = { 
          name: `${asset === 'ethereum' ? "ETH" : 'BTC'}-${instrumentType.toUpperCase()}-${dateFormatted}`,
          size: 0,
          bidPrice: 0,
          bid: '0 \n $0',
          ask: '0 \n $0',
          askPrice: 0,
          askSize: 0,
          strike: inst.strike.toString(),
          type: instrumentType,
          asset: asset,
          expiryDate: dateFormatted,
          marketAddress: optifiMarketAddress
        };   
  
        for (let order of bids) {
          const fixedPrice = toFixed(order.price);
          if(fixedPrice > row.bidPrice) {
            row.bidPrice = fixedPrice;
            const coinValue = asset === 'ethereum' ? fixedPrice * ethPrice : fixedPrice * btcPrice;
            row.bid = `${coinValue} \n $${fixedPrice}`;
          }
          if(order.size > row.size) row.size = order.size;
        }
  
        for (let order of asks) {
          const fixedPrice = toFixed(order.price);
          if(fixedPrice > row.askPrice) {
            row.askPrice = fixedPrice;
            const coinValue = asset === 'ethereum' ? fixedPrice * ethPrice : fixedPrice * btcPrice;
            row.ask = `${coinValue} \n $${fixedPrice}`;
          }
          if(order.size > row.askSize) row.askSize = order.size;
        }
        
        if(instrumentType === "put" && (parseInt(row.strike) > 0 && parseInt(row.strike) < 1000000)) {
          if(first) setPutChainData((chainData: any) => [...chainData, row])
          else if(!first) tempPut.push(row)
        }
        if(instrumentType === "call" && (parseInt(row.strike) > 0 && parseInt(row.strike) < 1000000)) {
          if(first) setCallChainData((chainData: any) => [...chainData, row])
          else if(!first) tempCall.push(row)
        }
        if(instrumentType === "future" && (parseInt(row.strike) > 0 && parseInt(row.strike) < 1000000)) {
          if(first) setFutureChainData((chainData: any) => [...chainData, row])
          else if(!first) tempFuture.push(row)
        }
        resolve(inst)
      })
    })
  }

  React.useEffect(() => {
    if(context !== null && optifiMarkets !== null && callChainData.length === 0 && putChainData.length === 0) {
      getChain(true)
    }
    const timer = window.setInterval(() => {    
      if(context !== null && optifiMarkets !== null) {
        getChain(false)
      }
    }, 60000);
    return () => {
      window.clearInterval(timer);
    };
  }, [context, optifiMarkets]);



/*   const checkBGColor = (header: string) => {
    if ((header === "IV" || header === "Bid") || (header === "Ask" && colorMode === "dark")) return "#1B372A";
    if ((header === "IV" || header === "Bid") || (header === "Ask" && colorMode === "light")) return "#E3FCF0";
    if ((header !== "IV" && header !== "Bid") && (header !== "Ask" && colorMode === "dark")) return "#182834";
    if ((header !== "IV" && header !== "Bid") && (header !== "Ask" && colorMode === "light")) return "#FFF";
  } */

  const checkFontColor = (header: string) => {
    if (header === "Bid" && colorMode === "dark") return "#36FF9F";
    if (header === "Bid" && colorMode === "light") return "#00A254";
    if (header === "Ask" && colorMode === "dark") return "#FF9696";
    if (header === "Ask" && colorMode === "light") return "#DF0D0D";
    if (colorMode === "dark") return "#C3D2E0"; else return "#0B2237";
  }

  const getStrikeHeaderBGColor = (header: string) => {
    if (header === "Strike" && colorMode === "dark") return "#364B5F";
    if (header === "Strike" && colorMode === "light") return "#C3D2E0";
  }

  const getStrikeBGColor = (header: string) => {
    if (header === "Strike" && colorMode === "dark") return "#364B5F";
    if (header === "Strike" && colorMode === "light") return "#E9EEF3";
  }

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    // @ts-ignore
    rows,
    // @ts-ignore
  } = useTable({ columns, data: callChainData, initialState: { pageIndex: 0 } }, useSortBy, usePagination)

  const {
    getTableProps: getTablePropsPut,
    getTableBodyProps: getTableBodyPropsPut,
    headerGroups: headerGroupsPut,
    prepareRow: prepareRowPut,
    // @ts-ignore
    rows: rowsPage,
    // @ts-ignore
  } = useTable({ columns: putColumns, data: putChainData, initialState: { pageIndex: 0 } }, useSortBy, usePagination)

  const {
    getTableProps: getTablePropsFuture,
    getTableBodyProps: getTableBodyPropsFuture,
    headerGroups: headerGroupsFuture,
    prepareRow: prepareRowFuture,
    // @ts-ignore
    rows: rowsFuture,
    // @ts-ignore
  } = useTable({ columns: putColumns, data: futureChainData, initialState: { pageIndex: 0 } }, useSortBy, usePagination)

  return (
    <>
      <Box borderRadius="10px" textAlign="left" bg={colorMode === "dark" ? "header.dark" : "header.light"} w="100%" paddingTop={8} margin="auto" color="primary.100" marginTop="3%">
        {/* @ts-ignore */}
        <div style={{ display: "flex" }}>
          <Text color={colorMode === "dark" ? "text.lightGray" : "primary.900"} fontSize="md" marginBottom="2%" marginLeft="3.5%" fontWeight="bold">Option Chain</Text>
        {/* @ts-ignore */}
        </div>
        <Box display="grid" padding="0.5% 0 1% 0" gridTemplateColumns="33% 33% 33%" backgroundColor={colorMode === "dark" ? "#0A1720" : "#C3D2E0"} borderBottom={colorMode === "dark" ? "1px solid #50687E" : "1px solid #C3D2E0"}>
          <Box gridColumn="1" textAlign="center">
            <Text fontSize="md" fontWeight="600">Call</Text>
          </Box>
          <Box gridColumn="2" textAlign="center" display="flex">
{/*             <Text fontSize="md" fontWeight="600" marginLeft="15%">Maturity Date:</Text> <Text fontSize="md" fontWeight="bold" marginLeft="5%" color={colorMode === "dark" ? "#C3D2E0" : "#0B2237"}>30 Jul 2021</Text> */}
          </Box>
          <Box gridColumn="3" textAlign="center">
            <Text fontSize="md" fontWeight="600">Put</Text>
          </Box>
        </Box>
        <Box height="450px" overflowY="auto" display="flex" sx={{
          '&::-webkit-scrollbar': {
            width: '16px',
            borderRadius: '8px',
            backgroundColor: `rgba(0, 0, 0, 0.05)`,
          },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: '8px',
            backgroundColor: `rgba(0, 0, 0, 0.15)`,
          },
        }}>
          <Table {...getTableProps()} variant="simple" width="135%" height="min-content">
          {callChainData.length === 0 &&
              <>
                <TableCaption marginTop="7%">
                  No call instruments available
                </TableCaption>
              </>}
            <Thead>
              {headerGroups.map((headerGroup) => (
                <Tr bg={colorMode === "dark" ? "body.dark" : "body.light"} {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column, i) => (
                    <Th
                      // @ts-ignore
                      textTransform="capitalize" textAlign="right" borderRight={i === 5 ? 'none' : colorMode === "dark" ? "1px solid #50687E" : "1px solid #C3D2E0"} borderLeft={i === 0 ? 'none' : colorMode === "dark" ? "1px solid #50687E" : "1px solid #C3D2E0"} color={colorMode === "dark" ? "#C3D2E0" : "#0B2237"} backgroundColor={getStrikeHeaderBGColor(column.render('Header'))}
                      // @ts-ignore
                      isNumeric={column.isNumeric} fontSize={13} key={i}
                    >
                      {column.render("Header")}
                    </Th>
                  ))}
                </Tr>
              ))}
            </Thead>
            <Tbody  {...getTableBodyProps()}>
              {callChainData.length > 0 && rows && rows.map((row: any, i: number) => {
                prepareRow(row)

                return (
                  <tr {...row.getRowProps()} onClick={() => openPlaceOrderModal(row.original)} >
                    {row.cells.map((cell: any, i: number) => {
                      return <Td fontSize="sm" key={i}
                        backgroundColor={getStrikeBGColor(cell.render('Header'))}
                        color={checkFontColor(cell.render('Header'))} 
                        whiteSpace="pre-line" fontWeight="400" border={colorMode === "dark" ? "1px solid #50687E" : "1px solid #C3D2E0"} textAlign="right" {...cell.getCellProps()}>{cell.render('Cell')}</Td>
                    })}
                  </tr>
                )
              })}
            </Tbody>
          </Table>
          <Table {...getTablePropsPut()} variant="simple" height="min-content">
          {putChainData.length === 0 &&
              <>
                <TableCaption marginTop="7%">
                  No put instruments available
                </TableCaption>
              </>}
            <Thead>
              {headerGroupsPut.map((headerGroup) => (
                <Tr bg={colorMode === "dark" ? "body.dark" : "body.light"} {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column, i) => (
                    <Th
                      // @ts-ignore
                      textTransform="capitalize" textAlign="right" borderRight={i === 5 ? 'none' : colorMode === "dark" ? "1px solid #50687E" : "1px solid #C3D2E0"} borderLeft={i === 0 ? 'none' : colorMode === "dark" ? "1px solid #50687E" : "1px solid #C3D2E0"} color={colorMode === "dark" ? "#C3D2E0" : "#0B2237"} backgroundColor={getStrikeHeaderBGColor(column.render('Header'))}
                      // @ts-ignore
                      isNumeric={column.isNumeric} fontSize={13} key={i}
                    >
                      {column.render("Header")}
                    </Th>
                  ))}
                </Tr>
              ))}
            </Thead>
            <Tbody  {...getTableBodyPropsPut()}>
              {putChainData.length > 0 && rowsPage && rowsPage.map((row: any, i: number) => {
                prepareRowPut(row)

                return (
                  <tr {...row.getRowProps()} onClick={() => openPlaceOrderModal(row.original)}>
                    {row.cells.map((cell: any, i: number) => {
                      return <Td fontSize="sm" key={i}
                        backgroundColor={getStrikeBGColor(cell.render('Header'))}
                        color={checkFontColor(cell.render('Header'))} 
                        whiteSpace="pre-line" fontWeight="400" border={colorMode === "dark" ? "1px solid #50687E" : "1px solid #C3D2E0"} textAlign="right" {...cell.getCellProps()}>{cell.render('Cell')}</Td>
                    })}
                  </tr>
                )
              })}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </>
  );
}

export default OptionChain;
