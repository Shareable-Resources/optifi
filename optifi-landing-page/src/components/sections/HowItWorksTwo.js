import React from 'react';
import classNames from 'classnames';
import { SectionSplitProps } from '../../utils/SectionProps';
import StepTwo from '../../assets/images/step2.png';

const propTypes = {
  ...SectionSplitProps.types
}

const defaultProps = {
  ...SectionSplitProps.defaults
}

const HowItWorksTwo = ({
  className,
  topOuterDivider,
  bottomOuterDivider,
  topDivider,
  bottomDivider,
  hasBgColor,
  invertColor,
  invertMobile,
  invertDesktop,
  alignTop,
  imageFill,
  backgroundColor,
  ...props
}) => {

  const outerClasses = classNames(
    'features-split section',
    topOuterDivider && 'has-top-divider',
    bottomOuterDivider && 'has-bottom-divider',
    hasBgColor && 'has-bg-color',
    invertColor && 'invert-color',
    className
  );

  const innerClasses = classNames(
    'features-split-inner section-inner',
    topDivider && 'has-top-divider',
    bottomDivider && 'has-bottom-divider'
  );

  const splitClasses = classNames(
    'split-wrap',
    invertMobile && 'invert-mobile',
    invertDesktop && 'invert-desktop',
    alignTop && 'align-top'
  );

  return (
    <section
      {...props}
      className={outerClasses}
      style={{backgroundColor: '#142124'}}
    >
      <div className="container">
        <div className={innerClasses}>
          <div className={splitClasses}>
            <div className="split-item" style={{display: 'none'}}>
              

            </div>
            <div className="split-item" style={{marginLeft: '10%'}}>
              <div className="split-item-content center-content-mobile reveal-from-right" data-reveal-container=".split-item">
                <h3 className="mt-0 mb-12">
                  Step 2
                  </h3>
                <p className="m-0">
                Go to the order book, pick-and-choose strike, 
                and maturity on a put or <br/>
                call option and complete the trade
                  </p>
              </div>
              <div className={
                classNames(
                  'split-item-image center-content-mobile reveal-from-bottom',
                  imageFill && 'split-item-image-fill'
                )}
                data-reveal-container=".split-item">
                <img
                  id="stepTwoImg"
                  src={StepTwo}
                  alt="Step 2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

HowItWorksTwo.propTypes = propTypes;
HowItWorksTwo.defaultProps = defaultProps;

export default HowItWorksTwo;