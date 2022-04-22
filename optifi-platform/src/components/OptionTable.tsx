import React, { useState, useEffect, useContext, useMemo } from 'react';
import '../assets/scss/_optionTable.scss';
import GlobalContext from '../contexts/globalContext';

import { chakra, Flex, Spinner, Grid, Box } from '@chakra-ui/react';
import { Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/table';

import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

import { formatNumber, formatToUSD } from '../utils/formatters';
import { OptionTableHead } from './OptionTableHead';
import PlaceOrderModal from './PlaceOrderModal';
import { Tooltip } from './Tooltip';
import '../assets/scss/_tooltip.scss';

export type OptionByDate = {
  id: string;
  options: OptionPair[];
  callOption: Option;
  putOption: Option;
};
type OptionPair = {
  callOptions: Option;
  putOptions: Option;
  expiryDate: string;
};
type Option = {
  askOrderId: anchor.BN;
  askPrice: string; // ASK
  askSize: number; // IV-A
  asset: number;
  authority: PublicKey;
  bidOrderId: anchor.BN;
  bidPrice: string; // IV-B
  bidSize: number; // BID
  contractSizePercent: anchor.BN;
  duration: anchor.BN;
  expiryDate: string; // ? should be same across then?
  expiryType: any;
  instrumentType: 'call' | 'put';
  isListedOnMarket: boolean;
  marketAddress: string;
  marketId: string; //
  start: anchor.BN;
  strike: string; // STRIKE
  volume: number; // VOLUME
};

type OptionTableProps = {
  showIV: boolean;
  showDelta: boolean;
  showSize: boolean;
  dateTab: string;
  optionsByDate: OptionByDate[];
  openOrder: any[] | undefined;
  positions: any[] | undefined;
};
function OptionTable({
  showIV,
  showDelta,
  showSize,
  optionsByDate,
  openOrder,
  positions,
}: OptionTableProps) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<object>({});

  const onOptionClick = (opt: Option) => {
    setSelectedOption(opt);
    setIsModalOpen(true);
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'id',
        columns: [
          {
            Header: 'Instrument Type',
            accessor: 'callOptions.instrumentType',
          },
          {
            Header: 'bidSize',
            accessor: 'callOptions.bidSize',
          },
          {
            Header: 'bidPrice',
            accessor: 'callOptions.bidPrice',
          },
          {
            Header: 'askSize',
            accessor: 'callOptions.askSize',
          },
          {
            Header: 'askPrice',
            accessor: 'callOptions.askPrice',
          },
          {
            Header: 'Vol',
            accessor: 'callOptions.volume',
          },
          {
            Header: 'strike',
            accessor: 'callOptions.strike',
          },
          {
            Header: 'Instrument Type',
            accessor: 'putOptions.instrumentType',
          },
          {
            Header: 'bidSize',
            accessor: 'putOptions.bidSize',
          },
          {
            Header: 'bidPrice',
            accessor: 'putOptions.bidPrice',
          },
          {
            Header: 'askSize',
            accessor: 'putOptions.askSize',
          },
          {
            Header: 'askPrice',
            accessor: 'putOptions.askPrice',
          },
          {
            Header: 'Vol',
            accessor: 'putOptions.volume',
          },
        ],
      },
    ],
    []
  );

  const data = {
    last: 0.609,
    size: 18.5,
    ivb: 58.2,
    bid: 24588.44,
    ask: 24588.44,
    iva: 109.4,
    size2: 68.5,
    vol: 213.7,
    delta: 0.95,
    strike: 30000,
    last_: 0.609,
    size_: 18.5,
    ivb_: 58.2,
    bid_: 24588.44,
    ask_: 24588.44,
    iva_: 109.4,
    size2_: 68.5,
    vol_: 213.7,
    delta_: 0.95,
  };
  const datas = [];
  for (let i = 0; i < 15; i++) {
    datas.push(data);
  }

  return (
    <>
      <PlaceOrderModal
        userOpenOrder={openOrder}
        positions={positions}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        selectedOption={selectedOption}
      />
      {optionsByDate.length > 0 ? (
        optionsByDate.map((opt, index) => {
          return (
            <Box key={index}>
              <OptionTableHead
                indexPrice={1244.12}
                dateSelected={new Date(opt.id)}
                expiryDate={new Date()}
              />
              {opt.options[0].putOptions && (
                <CallPutTable
                  showIV={showIV}
                  showDelta={showDelta}
                  showSize={showSize}
                  options={opt.options}
                  ff={opt}
                  click={onOptionClick}
                />
              )}
            </Box>
          );
        })
      ) : (
        <Flex direction="column" align="center">
          <Spinner
            // thickness="4px"
            // speed="0.65s"
            // emptyColor="gray.200"
            // color="blue.500"
            size="xl"
          />
          <chakra.span>Loading Options...</chakra.span>
        </Flex>
      )}
    </>
  );
}

type CallPutTableProp = {
  options: OptionPair[];
  ff: any;
  click: any;
  showIV: boolean;
  showDelta: boolean;
  showSize: boolean;
};
const CallPutTable = ({
  options,
  click,
  ff,
  showIV,
  showDelta,
  showSize,
}: CallPutTableProp) => {
  return (
    <Grid gridTemplateColumns="45% 10% 45%" minWidth="1000px">
      <Table className="option-table">
        <Thead backgroundColor="#1D2430">
          <Tr>
            <Th
              _first={{ paddingLeft: '16px' }}
              _last={{ textAlign: 'right', paddingRight: '16px' }}
              _hover={{ textColor: 'white', textDecorationColor: 'white' }}
              textDecoration="underline"
              paddingX="0"
              paddingY="8px"
            >
              Last
            </Th>
            {showSize && (
              <Th
                className="tooltip"
                _hover={{ textColor: 'white', textDecorationColor: 'white' }}
                textDecoration="underline"
                paddingX="0"
                paddingY="8px"
              >
                Size
                <Tooltip
                  title="Size"
                  description="This is the volume that is on the best bid."
                />
              </Th>
            )}
            {showIV && (
              <Th
                className="tooltip"
                _hover={{ textColor: 'white', textDecorationColor: 'white' }}
                textDecoration="underline"
                paddingX="0"
                paddingY="8px"
              >
                IV-B
                <Tooltip
                  title="Implied Volatility - Bid"
                  description="A calculation on how much the underlying asset price is expected to move over a year based on the current highest bid."
                />
              </Th>
            )}
            <Th
              className="tooltip"
              _hover={{ textColor: 'white', textDecorationColor: 'white' }}
              textDecoration="underline"
              paddingX="0"
              paddingY="8px"
            >
              Bid
              <Tooltip
                title="Bid"
                description="Best price someone on the market is buying at."
              />
            </Th>
            <Th
              className="tooltip"
              _hover={{ textColor: 'white', textDecorationColor: 'white' }}
              textDecoration="underline"
              paddingX="0"
              paddingY="8px"
            >
              Ask
              <Tooltip
                title="Ask"
                description="Best price someone on the market is selling at."
              />
            </Th>
            {showIV && (
              <Th
                className="tooltip"
                _hover={{ textColor: 'white', textDecorationColor: 'white' }}
                textDecoration="underline"
                paddingX="0"
                paddingY="8px"
              >
                IV-A
                <Tooltip
                  title="Implied Volatility - Ask"
                  description="A calculation on how much the underlying asset price is expected to move over a year based on the current lowest ask."
                />
              </Th>
            )}
            {showSize && (
              <Th
                className="tooltip"
                _hover={{ textColor: 'white', textDecorationColor: 'white' }}
                textDecoration="underline"
                paddingX="0"
                paddingY="8px"
              >
                Size
                <Tooltip
                  title="Size"
                  description="This is the volume that is on the best ask."
                />
              </Th>
            )}
            <Th
              className="tooltip"
              _hover={{ textColor: 'white', textDecorationColor: 'white' }}
              textDecoration="underline"
              paddingX="0"
              paddingY="8px"
            >
              Vol
            </Th>
            {showDelta && (
              <Th
                className="tooltip"
                _hover={{ textColor: 'white', textDecorationColor: 'white' }}
                textDecoration="underline"
                paddingX="0"
                paddingY="8px"
              >
                Delta
                <Tooltip
                  title="Delta"
                  description="Delta is a risk measure and gives the change in USD price as the underlying changes."
                />
              </Th>
            )}
          </Tr>
        </Thead>
        <Tbody
          padding="0 16px"
          maxHeight="215px"
          overflowY="scroll"
          className="option-table-body"
        >
          {options.map((opt, index) => (
            <Tr
              margin="0 16px"
              cursor="pointer"
              key={index}
              onClick={() => click(opt.callOptions)}
            >
              <Td
                _first={{ paddingLeft: '16px' }}
                fontSize="13px"
                lineHeight="16px"
                paddingX="0"
                paddingY="8px"
                fontWeight="700"
                className="call-options"
              >
                {/* {option.callOptions.last} */}
                n/a
              </Td>
              {showSize && (
                <Td
                  fontSize="13px"
                  lineHeight="16px"
                  paddingX="0"
                  paddingY="8px"
                  fontWeight="700"
                  className="call-options"
                >
                  {opt.callOptions.bidSize}
                </Td>
              )}
              {showIV && (
                <Td
                  fontSize="13px"
                  lineHeight="16px"
                  paddingX="0"
                  paddingY="8px"
                  fontWeight="700"
                  color="text.moneyGreen"
                  className="call-options"
                >
                  N/A
                  {/* {Number.parseFloat(opt.callOptions.bidPrice) * 100}% */}
                </Td>
              )}
              <Td
                fontSize="13px"
                lineHeight="16px"
                paddingX="0"
                paddingY="8px"
                fontWeight="700"
                color="text.moneyGreen"
                className="call-options"
              >
                {formatToUSD(parseFloat(opt.callOptions.bidPrice))}
                {/* {formatToUSD(opt.callOptions.bidSize)} */}
              </Td>
              <Td
                fontSize="13px"
                lineHeight="16px"
                paddingX="5px"
                paddingY="8px"
                fontWeight="700"
                color="text.moneyRed"
                className="call-options"
              >
                {/* {formatToUSD(option.callOptions.ask)} */}
                {formatToUSD(parseFloat(opt.callOptions.askPrice))}
              </Td>
              {showIV && (
                <Td
                  fontSize="13px"
                  lineHeight="16px"
                  paddingX="0"
                  paddingY="8px"
                  fontWeight="700"
                  color="text.moneyRed"
                  className="call-options"
                >
                  N/A
                  {/* {opt.callOptions.askPrice} */}
                </Td>
              )}
              {showSize && (
                <Td
                  fontSize="13px"
                  lineHeight="16px"
                  paddingX="0"
                  paddingY="8px"
                  fontWeight="700"
                  className="call-options"
                >
                  {opt.callOptions.askSize}
                </Td>
              )}
              <Td
                fontSize="13px"
                lineHeight="16px"
                paddingX="0"
                paddingY="8px"
                fontWeight="700"
                className="call-options"
              >
                {opt.callOptions.volume}
              </Td>
              {showDelta && (
                <Td
                  fontSize="13px"
                  lineHeight="16px"
                  paddingX="0"
                  paddingY="8px"
                  fontWeight="700"
                  className="call-options"
                >
                  {/* {option.callOptions.delta} */} N/A
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Table className="option-table" overflowX="scroll">
        <Thead backgroundColor="#1D2430">
          <Tr>
            <Th
              className="tooltip"
              _hover={{ textColor: 'white', textDecorationColor: 'white' }}
              paddingY="8px"
              whiteSpace="nowrap"
              textColor="text.white"
              textDecoration="underline"
              backgroundColor="#364051"
              textAlign="center"
            >
              <Flex className="tooltip-wrap" justifyContent="center">
                Strike
              </Flex>
              <Tooltip
                title="Strike"
                description="The price at which an option can be exercised."
              />
            </Th>
          </Tr>
        </Thead>
        <Tbody
          padding="0 16px"
          maxHeight="215px"
          overflowY="scroll"
          className="option-table-body"
        >
          {options.map((opt, index) => (
            <Tr margin="0 16px" key={index}>
              <Td
                fontSize="13px"
                lineHeight="16px"
                paddingX="0px"
                paddingY="8px"
                fontWeight="700"
                backgroundColor="#364051"
                textAlign="center"
              >
                {formatNumber(Number.parseInt(opt.callOptions.strike))}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Table className="option-table" overflowX="scroll">
        <Thead backgroundColor="#1D2430">
          <Tr>
            <Th
              className="tooltip"
              _hover={{ textColor: 'white', textDecorationColor: 'white' }}
              textDecoration="underline"
              paddingX="0"
              paddingY="8px"
              textAlign="right"
            >
              Last
            </Th>
            {showSize && (
              <Th
                className="tooltip"
                _hover={{ textColor: 'white', textDecorationColor: 'white' }}
                textDecoration="underline"
                paddingX="0"
                paddingY="8px"
                textAlign="right"
              >
                Size
                <Tooltip
                  isPut={true}
                  title="Size"
                  description="This is the volume that is on the best bid."
                />
              </Th>
            )}
            {showIV && (
              <Th
                className="tooltip"
                _hover={{ textColor: 'white', textDecorationColor: 'white' }}
                textDecoration="underline"
                paddingX="0"
                paddingY="8px"
                textAlign="right"
              >
                IV-B
                <Tooltip
                  isPut={true}
                  title="Implied Volatility - Bid"
                  description="A calculation on how much the underlying asset price is expected to move over a year based on the current highest bid."
                />
              </Th>
            )}
            <Th
              className="tooltip"
              _hover={{ textColor: 'white', textDecorationColor: 'white' }}
              textDecoration="underline"
              paddingX="0"
              paddingY="8px"
              textAlign="right"
            >
              Bid
              <Tooltip
                isPut={true}
                title="Bid"
                description="Best price someone on the market is buying at."
              />
            </Th>
            <Th
              className="tooltip"
              _hover={{ textColor: 'white', textDecorationColor: 'white' }}
              textDecoration="underline"
              paddingX="0"
              paddingY="8px"
              textAlign="right"
            >
              Ask
              <Tooltip
                isPut={true}
                title="Ask"
                description="Best price someone on the market is selling at."
              />
            </Th>
            {showIV && (
              <Th
                className="tooltip"
                _hover={{ textColor: 'white', textDecorationColor: 'white' }}
                textDecoration="underline"
                paddingX="0"
                paddingY="8px"
                textAlign="right"
              >
                IV-A
                <Tooltip
                  isPut={true}
                  title="Implied Volatility - Ask"
                  description="A calculation on how much the underlying asset price is expected to move over a year based on the current lowest ask."
                />
              </Th>
            )}
            {showSize && (
              <Th
                className="tooltip"
                _hover={{ textColor: 'white', textDecorationColor: 'white' }}
                textDecoration="underline"
                paddingX="0"
                paddingY="8px"
                textAlign="right"
              >
                Size
                <Tooltip
                  isPut={true}
                  title="Size"
                  description="This is the volume that is on the best ask."
                />
              </Th>
            )}
            <Th
              className="tooltip"
              _hover={{ textColor: 'white', textDecorationColor: 'white' }}
              textDecoration="underline"
              paddingX="0"
              paddingY="8px"
              textAlign="right"
              paddingRight={showDelta ? '0' : '16px'}
            >
              Vol
            </Th>
            {showDelta && (
              <Th
                _last={{ paddingRight: '16px' }}
                className="tooltip"
                _hover={{ textColor: 'white', textDecorationColor: 'white' }}
                textDecoration="underline"
                paddingX="0"
                paddingY="8px"
                textAlign="right"
              >
                Delta
                <Tooltip
                  isPut={true}
                  title="Delta"
                  description="Delta is a risk measure and gives the change in USD price as the underlying changes."
                />
              </Th>
            )}
          </Tr>
        </Thead>
        <Tbody
          padding="0 16px"
          maxHeight="215px"
          overflowY="scroll"
          className="option-table-body"
        >
          {options.map((opt, index) => (
            <Tr
              margin="0 16px"
              key={index}
              onClick={() => click(opt.putOptions)}
              cursor="pointer"
            >
              <Td
                fontSize="13px"
                lineHeight="16px"
                paddingX="0"
                paddingY="8px"
                fontWeight="700"
                textAlign="right"
                className="put-options"
              >
                {/* {option.putOptions.last_} */} N/A
              </Td>
              {showSize && (
                <Td
                  fontSize="13px"
                  lineHeight="16px"
                  paddingX="0"
                  paddingY="8px"
                  fontWeight="700"
                  textAlign="right"
                  className="put-options"
                >
                  {/* {option.putOptions.size_} */}
                  {opt.putOptions.bidSize}
                </Td>
              )}
              {showIV && (
                <Td
                  fontSize="13px"
                  lineHeight="16px"
                  paddingX="0"
                  paddingY="8px"
                  fontWeight="700"
                  textAlign="right"
                  color="text.moneyGreen"
                  className="put-options"
                >
                  {/* {opt.putOptions.bidPrice} */}
                  N/A
                </Td>
              )}
              <Td
                fontSize="13px"
                lineHeight="16px"
                paddingX="0"
                paddingY="8px"
                fontWeight="700"
                textAlign="right"
                color="text.moneyGreen"
                className="put-options"
              >
                {formatToUSD(parseFloat(opt.putOptions.bidPrice))}
              </Td>
              <Td
                fontSize="13px"
                lineHeight="16px"
                paddingX="0"
                paddingY="8px"
                fontWeight="700"
                textAlign="right"
                color="text.moneyRed"
                className="put-options"
              >
                {formatToUSD(opt.putOptions.askSize)}
              </Td>
              {showIV && (
                <Td
                  fontSize="13px"
                  lineHeight="16px"
                  paddingX="0"
                  paddingY="8px"
                  fontWeight="700"
                  textAlign="right"
                  color="text.moneyRed"
                  className="put-options"
                >
                  N/A
                </Td>
              )}
              {showSize && (
                <Td
                  fontSize="13px"
                  lineHeight="16px"
                  paddingX="0"
                  paddingY="8px"
                  fontWeight="700"
                  textAlign="right"
                  className="put-options"
                >
                  {opt.putOptions.askSize}
                </Td>
              )}
              <Td
                fontSize="13px"
                lineHeight="16px"
                paddingX="0"
                paddingY="8px"
                paddingRight={showDelta ? '0' : '16px'}
                fontWeight="700"
                textAlign="right"
                className="put-options"
              >
                {opt.putOptions.volume}
              </Td>
              {showDelta && (
                <Td
                  _last={{ paddingRight: '16px' }}
                  fontSize="13px"
                  lineHeight="16px"
                  paddingX="0"
                  paddingY="8px"
                  fontWeight="700"
                  textAlign="right"
                  className="put-options"
                >
                  {/* {option.putOptions.delta_} */} N/A
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Grid>
  );
};

export default OptionTable;
