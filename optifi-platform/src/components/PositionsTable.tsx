import React, { useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  InputGroup,
  InputRightElement,
  Tr,
  Th,
  Text,
  Td,
  Input,
  Button,
  Image,
  Flex,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { PositionsProps } from './OrderHistory';
import '../assets/scss/_orderHistory.scss';
import putIcon from '../assets/icons/put_icon.svg';
import callIcon from '../assets/icons/call_icon.svg';

type dataProps = { data: PositionsProps[]; headers: any };

function PositionsTable({ data, headers }: dataProps) {
  return (
    <Table variant={'unstyled'} className={'purchase-history-table'}>
      <Thead>
        <Tr>
          {headers.map((header: string, index: number) => {
            if (header === 'Instrument') {
              return (
                <Th
                  key={index}
                  fontWeight={400}
                  fontFamily={'Almarai'}
                  fontSize={'13px'}
                  textTransform={'none'}
                  lineHeight={'16px'}
                  color={'#B2B0BC'}
                >
                  {header}
                </Th>
              );
            }
            return (
              <Th
                key={index}
                fontWeight={400}
                fontFamily={'Almarai'}
                fontSize={'13px'}
                textTransform={'none'}
                lineHeight={'16px'}
                color={'#B2B0BC'}
                textAlign={'right'}
              >
                {header}
              </Th>
            );
          })}
        </Tr>
      </Thead>
      <Tbody>
        {data.map((cell, index) => (
          <PositionCells key={index} data={cell} />
        ))}
      </Tbody>
    </Table>
  );
}

const PositionCells = ({ data }: any) => {
  const [showInput, setShowInput] = useState(false);
  const [amount, setAmount] = useState<number | string>(0);

  return (
    <Tr
      _hover={{
        background: '#364051',
      }}
    >
      <Td>
        <Flex>
          <Text>{data.instrument}</Text>
          {data.instrument.slice(-1) === 'C' ? (
            <Image src={callIcon} maxH={'18px'}></Image>
          ) : (
            <Image src={putIcon} maxH={'18px'}></Image>
          )}
        </Flex>
      </Td>
      <Td>{data.size}</Td>
      <Td>{data.value}</Td>
      <Td>{data.avgP}</Td>
      <Td>{data.marketP}</Td>
      <Td>{data.liqP}</Td>
      <Td color={'text.moneyGreen'}>{data.pnl}</Td>
      <Td>{data.initMargin}</Td>
      <Td>{data.maintenanceMargin}</Td>
      <Td>{data.delta}</Td>
      <Td>{data.vega}</Td>
      <Td>{data.gamma}</Td>
      <Td>{data.theta}</Td>
      <Td>{data.rho}</Td>

      {!showInput ? (
        <Td>
          <Button
            size={'xs'}
            paddingX={'24px'}
            paddingY={0}
            backgroundColor={'#4E5A71'}
            onClick={() => setShowInput(true)}
          >
            <Text fontSize={'13px'}>Cancel</Text>
          </Button>
        </Td>
      ) : (
        <Td maxW={'10px'}>
          <InputGroup size={'xs'}>
            <Input value={amount} onChange={e => setAmount(e.target.value)} />
            <InputRightElement>
              <Button
                padding={'2px'}
                paddingRight={'4px'}
                size={'xxs'}
                variant={'unstyled'}
              >
                <CheckIcon _hover={{ color: '#9c7bee' }} />
              </Button>
              <Button
                padding={'2px'}
                paddingRight={'20px'}
                paddingLeft={'4px'}
                size={'xxs'}
                variant={'unstyled'}
                onClick={() => setShowInput(false)}
              >
                <Text _hover={{ color: '#9c7bee' }} fontSize={'16px'}>
                  x
                </Text>
              </Button>
            </InputRightElement>
          </InputGroup>
        </Td>
      )}
    </Tr>
  );
};

export default PositionsTable;
