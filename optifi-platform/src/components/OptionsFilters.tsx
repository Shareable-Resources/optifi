import React, { Dispatch, SetStateAction, useEffect } from 'react';

// Chakra
import { Flex, Stack } from '@chakra-ui/layout';
import { Tab, TabList, Tabs } from '@chakra-ui/tabs';

import { CheckboxCustom } from './CheckboxCustom';
import moment from 'moment';

const checkboxes = ['IV', 'Delta', 'Size', 'Position'];
type OptionsFiltersProps = {
  IVCheckbox: boolean;
  setIVCheckbox: Dispatch<SetStateAction<boolean>>;
  deltaCheckbox: boolean;
  setDeltaCheckbox: Dispatch<SetStateAction<boolean>>;
  sizeCheckbox: boolean;
  setSizeCheckbox: Dispatch<SetStateAction<boolean>>;
  positionCheckbox: boolean;
  setPositionCheckbox: Dispatch<SetStateAction<boolean>>;
  setDateTab: Dispatch<SetStateAction<string>>;
  dateList: string[];
};

export const OptionsFilters = ({
  IVCheckbox,
  setIVCheckbox,
  deltaCheckbox,
  setDeltaCheckbox,
  sizeCheckbox,
  setSizeCheckbox,
  positionCheckbox,
  setPositionCheckbox,
  setDateTab,
  dateList,
}: OptionsFiltersProps) => {
  return (
    <Flex
      width="full"
      borderBottom="2px solid #4E5A71"
      flexDirection={{ base: 'column', md: 'row' }}
    >
      <Tabs paddingY="12px" paddingLeft="16px">
        <TabList borderBottom="none">
          {dateList.map((tab, index) => {
            return (
              <Tab
                key={index}
                onClick={() => setDateTab(tab)}
                marginRight="6px"
                padding="8px 12px"
                _selected={{
                  borderTop: '4px solid #9C7BEE',
                  boxShadow: 'none',
                  paddingTop: '4px',
                }}
                _active={{ backgroundColor: 'transparent' }}
                borderRadius="4px"
                border="1px solid #4E5A71"
                lineHeight="20px"
                fontSize="13px"
                textColor="text.white"
              >
                {tab !== 'All'
                  ? moment(new Date(tab)).format('YYYY-MM-DD')
                  : 'All'}
              </Tab>
            );
          })}
        </TabList>
      </Tabs>
      <Stack
        spacing={[1, 5]}
        direction={['column', 'row']}
        marginLeft="auto"
        marginRight="18px"
        marginTop={{ base: '12px', md: 'auto' }}
        marginBottom={{ base: '12px', md: 'auto' }}
      >
        <CheckboxCustom
          checked={IVCheckbox}
          setChecked={setIVCheckbox}
          title={checkboxes[0]}
        />
        <CheckboxCustom
          checked={deltaCheckbox}
          setChecked={setDeltaCheckbox}
          title={checkboxes[1]}
        />
        <CheckboxCustom
          checked={sizeCheckbox}
          setChecked={setSizeCheckbox}
          title={checkboxes[2]}
        />
        <CheckboxCustom
          checked={positionCheckbox}
          setChecked={setPositionCheckbox}
          title={checkboxes[3]}
        />
      </Stack>
    </Flex>
  );
};
