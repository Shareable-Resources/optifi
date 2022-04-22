import {
  chakra,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Box,
  Image,
} from '@chakra-ui/react';

import ExpandIcon from '../assets/pages/landing/faq-expand-icon.svg';
import CollapseIcon from '../assets/pages/landing/faq-collapse-icon.svg';

type AccordionProps = {
  items: Array<{ id: number; title: string; description: string }>;
};

export default function AccordionList({ items }: AccordionProps) {
  return (
    <Accordion allowMultiple>
      {items.map(item => {
        return (
          <AccordionItem
            borderTop="0px"
            borderBottomWidth="1px"
            borderColor="#DDDDDD"
            key={item.id}
          >
            {({ isExpanded }) => (
              <>
                <AccordionButton p="16px 0" _focus={{ boxShadow: 'unset' }}>
                  <Box
                    flex="1"
                    textAlign="left"
                    fontWeight="bold"
                    fontSize="18px"
                    lineHeight="32px"
                    fontFamily="Actor"
                  >
                    {item.title}
                  </Box>
                  {!isExpanded ? (
                    <Image src={ExpandIcon} alt="expand-icon" />
                  ) : (
                    <Image src={CollapseIcon} alt="collapse-icon" />
                  )}
                </AccordionButton>
                <AccordionPanel p="16px 0" fontSize="14px" lineHeight="20px">
                  <chakra.span
                    dangerouslySetInnerHTML={{
                      __html: item.description
                    }}
                  >
                  </chakra.span>
                </AccordionPanel>
              </>
            )}
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
