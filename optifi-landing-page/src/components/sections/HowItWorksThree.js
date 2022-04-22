import React from 'react';
import classNames from 'classnames';
import { SectionSplitProps } from '../../utils/SectionProps';
import StepThree from '../../assets/images/step3.png';

const propTypes = {
  ...SectionSplitProps.types
}

const defaultProps = {
  ...SectionSplitProps.defaults
}

const HowItWorksThree = ({
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
      style={{backgroundColor: '#081518'}}
    >
      <div className="container">
        <div className={innerClasses}>
          <div className={splitClasses}>
            <div className="split-item">
            <div className="split-item-content center-content-mobile reveal-from-left" data-reveal-container=".split-item"
              style={{marginLeft: '18%'}}>
                <h3 className="mt-0 mb-12">
                  Step 3
                  </h3>
                <p className="m-0">
                When a contract reaches maturity, receive unlimited yield if you're in-the-money, or absorb only limited losses if you're out-of-the-money.
                  </p>
              </div>
              <div className={
                classNames(
                  'split-item-image center-content-mobile reveal-from-bottom',
                  imageFill && 'split-item-image-fill'
                )}
                data-reveal-container=".split-item">
                <img
                  src={StepThree}
                  alt="Step 3"
                  id="stepThreeImg"
                  /> 
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

HowItWorksThree.propTypes = propTypes;
HowItWorksThree.defaultProps = defaultProps;

export default HowItWorksThree;