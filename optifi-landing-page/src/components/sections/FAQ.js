import React from 'react';
import classNames from 'classnames';
import { SectionTilesProps } from '../../utils/SectionProps';
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from 'react-accessible-accordion';

import 'react-accessible-accordion/dist/fancy-example.css';

const propTypes = {
  ...SectionTilesProps.types
}

const defaultProps = {
  ...SectionTilesProps.defaults
}

const Faq = ({
  className,
  topOuterDivider,
  bottomOuterDivider,
  topDivider,
  bottomDivider,
  hasBgColor,
  invertColor,
  pushLeft,
  ...props
}) => {

  const outerClasses = classNames(
    'faq section',
    topOuterDivider && 'has-top-divider',
    bottomOuterDivider && 'has-bottom-divider',
    hasBgColor && 'has-bg-color',
    invertColor && 'invert-color',
    className
  );

  const innerClasses = classNames(
    'faq-inner section-inner',
    topDivider && 'has-top-divider',
    bottomDivider && 'has-bottom-divider'
  );

  const tilesClasses = classNames(
    'tiles-wrap',
    pushLeft && 'push-left'
  );

  return (
    <section
      {...props}
      className={outerClasses}
    >
      <div className="container">
        <div className={innerClasses}>
        <p className="faq-title">FAQ</p>
          <div className={tilesClasses}>
          <Accordion preExpanded={['a']}>
            <AccordionItem  uuid="a">
                <AccordionItemHeading>
                    <AccordionItemButton>
                        What is a call/put option?
                    </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                    <p className="accordion-description">
                    An option is a contract giving the buyer the right, but not the obligation, to buy (in the case of a call option contract) or sell (in the case of a put option contract) the underlying asset at a specific price on a certain date.
                    </p>
                </AccordionItemPanel>
            </AccordionItem>

            <AccordionItem>
                <AccordionItemHeading>
                    <AccordionItemButton>
                    How are options on OptiFi priced?
                    </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                    <p className="accordion-description">
                      Optify options are european and are priced by market makers. But usually, the reference mathematical model for options pricing is Standard black scholes model.  {<> <br/><br/><a href="https://www.investopedia.com/articles/optioninvestor/07/options_beat_market.asp" target="_blank" rel="noreferrer">https://www.investopedia.com/articles/optioninvestor/07/options_beat_market.asp</a> <br/><br/></> }
                      

                      All the margining and collateral valuation is done using black-scholes model. 
                    </p>
                </AccordionItemPanel>
            </AccordionItem>

            <AccordionItem>
                <AccordionItemHeading>
                    <AccordionItemButton>
                      When is my option in profit (in-the-money)?
                    </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                    <p className="accordion-description">
                      A call option has unlimited potential profit (in-the-money) as the level of the underlying assets increases, and a potential loss limited to the premium paid for the call option contract. {<br/>}
                      A put option has substantial potential profit (in-the-money) that increases as the level of the underlying asset decreases to zero, and a potential loss that is limited to the premium paid for the put option contract.
                    </p>
                </AccordionItemPanel>
            </AccordionItem>

            <AccordionItem>
                <AccordionItemHeading>
                    <AccordionItemButton>
                    Do I need the capital to buy the underlying asset when exercising my options?
                    </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                    <p className="accordion-description">
                      No, OptiFi options do not pay out the underlying asset, rather just the difference between the price at the time of exercising and the strike price. 
                    </p>
                </AccordionItemPanel>
            </AccordionItem>

            <AccordionItem>
                <AccordionItemHeading>
                    <AccordionItemButton>
                    When can I exercise my option, and what happens when my option expires?
                    </AccordionItemButton>
                </AccordionItemHeading>
                <AccordionItemPanel>
                    <p className="accordion-description">
                      OptiFi options are European style options, meaning that they can only be exercised when at maturity. {<br/>}If your contract is in-the-money, OptiFi will auto-exercise the contract and disburse the payoff to your wallet. If the contract matures out-of-the-money, the option will not be exercised and the contract will simply expire. 
                    </p>
                </AccordionItemPanel>
            </AccordionItem>
        </Accordion>

          </div>
        </div>
      </div>
    </section>
  );
}

Faq.propTypes = propTypes;
Faq.defaultProps = defaultProps;

export default Faq;