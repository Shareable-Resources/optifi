import React, { useState, useEffect } from 'react';
import { format } from 'date-fns'
import { useWallet } from '@solana/wallet-adapter-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Label } from 'recharts';
import {
  Box,
  Text,
  useColorMode,
  Heading,
  Select,
  Button
} from '@chakra-ui/react';
import OptionChain from '../components/OptionChain';
import RecentTrades from '../components/RecentTrades';
import { createChart, CrosshairMode, IChartApi, ISeriesApi, } from 'lightweight-charts';

const CustomTooltip = (active: boolean, payload: any, label: string) => {
  if (active && payload !== undefined) {
    return (
      <div>
        <Box backgroundColor="#263f52" borderRadius="10px" padding="10px">
          <p><span style={{ color: payload[0].stroke }}>{`${payload[0].dataKey.charAt(0).toUpperCase()}${payload[0].dataKey.slice(1)}`}:</span> {payload[0].value}</p>
        </Box>
      </div>
    );
  }
  return null;
};

const CustomATMTooltip = (active: boolean, payload: any, label: string) => {
  if (active) {
    return (
      <div>
        <Box backgroundColor="#263f52" borderRadius="10px" padding="10px">
          <p>{label}</p>
          <p><span style={{ color: payload[0].stroke }}>{`${payload[0].dataKey.charAt(0).toUpperCase()}${payload[0].dataKey.slice(1)}`}:</span> {payload[0].value}</p>
          <p><span style={{ color: payload[1].stroke }}>{`${payload[1].dataKey.charAt(0).toUpperCase()}${payload[1].dataKey.slice(1)}`}:</span> {payload[1].value}</p>
          <p><span style={{ color: payload[2].stroke }}>{`${payload[2].dataKey.charAt(0).toUpperCase()}${payload[2].dataKey.slice(1)}`}:</span> {payload[2].value}</p>
          <p><span style={{ color: payload[3].stroke }}>{`${payload[3].dataKey.charAt(0).toUpperCase()}${payload[3].dataKey.slice(1)}`}:</span> {payload[3].value}</p>
        </Box>
      </div>
    );
  }

  return null;
};


function Dashboard() {
  const { colorMode } = useColorMode();
  const [chart, setChart] = useState<IChartApi>();
  const [chartSeries, setChartSeries] = useState<ISeriesApi<"Candlestick">>();
  const [ATMData, setATMData] = useState();
  const [skewData, setSkewData] = useState();
  const [coin, setCoin] = useState('BTC');
  const axios = require("axios");

  const getChartData = async () => {

    const domElement = document.getElementById('tvchart');
    var today = new Date();
    const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

    if (chart === undefined) {
      // @ts-ignore
      const newChart = createChart(domElement, {
        // @ts-ignore
        width: domElement.offsetWidth,
        height: 400,
        layout: {
          backgroundColor: '#161A25',
          textColor: 'rgba(255, 255, 255, 0.9)',
        },
        grid: {
          vertLines: {
            color: 'rgba(197, 203, 206, 0.3)',
          },
          horzLines: {
            color: 'rgba(197, 203, 206, 0.3)',
          },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
        },
      });
      var candleSeries = newChart.addCandlestickSeries({
        upColor: '#4bffb5',
        downColor: '#ff4976',
        borderDownColor: '#ff4976',
        borderUpColor: '#4bffb5',
        wickDownColor: '#838ca1',
        wickUpColor: '#838ca1',
      });

      setChartSeries(candleSeries);
      setChart(newChart);
      await axios({
        url: 'https://app.pinkswantrading.com/graphql',
        method: 'post',
        headers: {
          'x-oracle': 'EDNn8JcMuWogQwO5Bbog',
          'Content-Type': 'application/json',
          'accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        data: {
          query: `query OHLC($symbol: String, $dateStart: String, $dateEnd: String){
          RvOhlc(symbol: $symbol, dateStart: $dateStart, dateEnd: $dateEnd){
            time: date
            currency
            open
            high
            low
            close
          }
        }`,
          variables: { "parkinsonRange": 10, "symbol": coin, "dateStart": format(lastYear, 'MM-dd-yyyy') , "dateEnd": format(today, 'MM-dd-yyyy') }
        }
      }).then((result: any) => {
        const data = result.data.data.RvOhlc;
        data.forEach((i: any) => {
          i.time = format(new Date(parseFloat(i.time)), 'MM-dd-yyyy');
        });
        candleSeries.setData(data.slice(data.length - 200, data.length));
      });
    } else {
      await axios({
        url: 'https://app.pinkswantrading.com/graphql',
        method: 'post',
        headers: {
          'x-oracle': 'EDNn8JcMuWogQwO5Bbog',
          'Content-Type': 'application/json',
          'accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        data: {
          query: `query OHLC($symbol: String, $dateStart: String, $dateEnd: String){
          RvOhlc(symbol: $symbol, dateStart: $dateStart, dateEnd: $dateEnd){
            time: date
            currency
            open
            high
            low
            close
          }
        }`,
          variables: { "parkinsonRange": 10, "symbol": coin, "dateStart": format(lastYear, 'MM-dd-yyyy') , "dateEnd": format(today, 'MM-dd-yyyy') }
        }
      }).then((result: any) => {
        const data = result.data.data.RvOhlc;
        data.forEach((i: any)=> {
          i.time = format(new Date(parseFloat(i.time)), 'MM-dd-yyyy');
        });
        {/* @ts-ignore */}
        chartSeries.setData(data.slice(data.length - 200, data.length));
      });
    }

  }

  const getConstantMaturityAtm = () => {
    axios({
      url: 'https://app.pinkswantrading.com/graphql',
      method: 'post',
      headers: {
        'x-oracle': 'EDNn8JcMuWogQwO5Bbog',
        'Content-Type': 'application/json',
        'accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      data: {
        query: `
          query ConstantMaturityAtmIv($symbol: SymbolEnumType) {
            HistoricalConstantMaturityVariousAtmIv(symbol: $symbol) {
              date
              seven
              thirty
              sixty
              ninty
              onehundredeighty
            }
          }
          `,
        variables: { "symbol": coin }
      }
    }).then((result: any) => {
      var today = new Date();
      const lastYear = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      const data = result.data.data.HistoricalConstantMaturityVariousAtmIv.filter((obj: any) => obj.date > lastYear.getTime().toString())
      data.map((i: any) => {
        const date = new Date(parseFloat(i.date));
        const time = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
        i.date = time;
      });
      setATMData(data);
    });
  }

  const getSkew = () => {
    axios({
      url: 'https://app.pinkswantrading.com/graphql',
      method: 'post',
      headers: {
        'x-oracle': 'EDNn8JcMuWogQwO5Bbog',
        'Content-Type': 'application/json',
        'accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      data: {
        query: `query OrderbookSkew($symbol: SymbolEnumType, $exchange: ExchangeEnumType) {genericOrderbookSkew(symbol:$symbol, exchange: $exchange) {ts instrumentName strike expiration bidIv markIv askIv delta}}`,
        variables: { "symbol": coin, "exchange": "deribit" }
      }
    }).then((result: any) => {

      var today = new Date();
      const lastYear = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      const data = result.data.data.genericOrderbookSkew.filter((obj: any) => obj.ts > lastYear.getTime().toString())
      data.map((i: any) => {
        const date = new Date(parseFloat(i.ts));
        const time = `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
        i.ts = time;
      });
      setSkewData(data);
    });
  }

  const getQuickRations = () => {
    getConstantMaturityAtm();
    getSkew();
  }

  useEffect(() => {
    getQuickRations();
    getChartData();
  }, [coin])

  return (
    <>
      <Box textAlign="center" fontSize="xl" bg={colorMode === "dark" ? "body.dark" : "body.light"} >
        <Box minH="90vh" padding="5%" textAlign="left">
          <div style={{ display: 'flex' }}>
          <Heading color={"text.white"}>Dashboard</Heading>
            <Text marginLeft={20} marginBottom={6} marginTop={2} color={colorMode === "dark" ? "primary.100" : "primary.900"} fontWeight="bold" fontSize="md">Assets:</Text>
            <Select marginLeft={4} marginTop={0.3} border="none" variant="flushed" color={colorMode === "dark" ? "white" : "#50687E"} width="6%" fontWeight="bold" onChange={(e) => setCoin(e.target.value)}>
              <option style={{color: colorMode === "dark" ? "white" : "#50687E", fontFamily: 'Open Sans', fontWeight: 'bold'}} value="BTC">BTC</option>
              <option style={{color: colorMode === "dark" ? "white" : "#50687E", fontFamily: 'Open Sans', fontWeight: 'bold'}} value="ETH">ETH</option>
            </Select>
          </div>


          {/* <Box borderRadius="10px 10px" textAlign="center" justifyContent="center" bg={colorMode === "dark" ? "header.dark" : "header.light"} w="100%" p={10} margin="auto" color="primary.100" marginTop="3%">
            <Box textAlign="left">
              <Box textAlign="left" display="grid" paddingBottom="3%">
                <div>
                  <Text color={colorMode === "dark" ? "text.lightGray" : "primary.900"} fontSize="md" marginBottom="2%" fontWeight="bold">Quick Ratios</Text>
                </div>
              </Box>
              CHARTS TO BE INSERTED HERE
            </Box>
          </Box> */}

          <Box borderRadius="10px 10px" textAlign="center" justifyContent="center" bg={colorMode === "dark" ? "header.dark" : "header.light"} w="100%" p={10} margin="auto" color="primary.100" marginTop="3%">
            <Box textAlign="left">
              <Box textAlign="left">
                <div>
                  <Text color={colorMode === "dark" ? "text.lightGray" : "primary.900"} fontSize="md" marginBottom="2%" fontWeight="bold">{coin} Chart</Text>
                </div>
              </Box>
              <Box id="tvchart">
              </Box>
            </Box>
          </Box>

          <OptionChain />

          <Box display="grid" gridTemplateColumns="60% 40%" gridTemplateRows="45% 55%">
            <Box gridColumn="1" marginRight="4%">
              {/* <Box gridRow="1" marginBottom="2%">
                <RecentTrades />
              </Box> */}
              <Box gridRow="2">
                {/* @ts-ignore */}
                <Transactions dashboard />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default Dashboard;
