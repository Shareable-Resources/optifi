import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { SectionProps } from '../../utils/SectionProps';
import ButtonGroup from '../elements/ButtonGroup';
import Button from '../elements/Button';
import line from '../../assets/images/background-1-line.png'
import dashboard from '../../assets/images/dashboard.svg';
import solana from '../../assets/images/solana.svg'

const propTypes = {
  ...SectionProps.types
}

const defaultProps = {
  ...SectionProps.defaults
}

const Hero = ({
  className,
  topOuterDivider,
  bottomOuterDivider,
  topDivider,
  bottomDivider,
  hasBgColor,
  invertColor,
  ...props
}) => {

  const [videoModalActive, setVideomodalactive] = useState(false);

  const openModal = (e) => {
    e.preventDefault();
    setVideomodalactive(true);
  }

  const closeModal = (e) => {
    e.preventDefault();
    setVideomodalactive(false);
  }   

  const outerClasses = classNames(
    'hero section',
    topOuterDivider && 'has-top-divider',
    bottomOuterDivider && 'has-bottom-divider',
    hasBgColor && 'has-bg-color',
    invertColor && 'invert-color',
    className
  );

  const innerClasses = classNames(
    'hero-inner section-inner',
    topDivider && 'has-top-divider',
    bottomDivider && 'has-bottom-divider'
  );


  return (
    <section
      {...props}
      className={outerClasses}
    >
      <div className="container-sm">
        <div className={innerClasses}>
          <div className="hero-content">
            <h1 className="mt-0 mb-16 reveal-from-bottom main-screen-title" data-reveal-delay="200">
              OptiFi: Crypto Options
            </h1>
            <h1 className="mt-0 mb-16 reveal-from-bottom main-screen-title" data-reveal-delay="200">
             Trading Platform
            </h1>
            <div className="container-xs">
              <p className="m-0 mb-32 reveal-from-bottom main-screen-description" data-reveal-delay="400">
              Decentralized, permissionless, non-custodial, <br />lightning-fast.
                </p>
              <div className="reveal-from-bottom" data-reveal-delay="600">
                <ButtonGroup>
                  <Button tag="a" color="primary" wideMobile href="#">
                    Start Trading
                    </Button>
                </ButtonGroup>
                <div style={{marginTop: '3%', display: 'flex'}}>
                  <span id="poweredBy">Powered by</span> <img id="hero-solana" src={solana} />
                </div>
              </div>
            </div>
          </div>
          <img id="main-screen-line" src={line}/>
          <img id="main-screen-dashboard" src={dashboard}/>
        </div>
        
      </div>
    </section>
  );
}

Hero.propTypes = propTypes;
Hero.defaultProps = defaultProps;

export default Hero;