import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Router from 'next/router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled from 'styled-components';
import cookie from 'js-cookie';
import axios from 'axios';
import SettingsWelcome from './SettingsWelcome';
import SettingsDomain from './SettingsDomain';
import SettingsPassword from './SettingsPassword';
import SettingsApi from './SettingsApi';
import Modal from '../Modal';
import { fadeIn } from '../../helpers/animations';
import {
  deleteCustomDomain,
  generateApiKey,
  getUserSettings,
  setCustomDomain,
  showDomainInput,
} from '../../actions';

const Wrapper = styled.div`
  poistion: relative;
  width: 600px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 0 80px;
  animation: ${fadeIn} 0.8s ease;

  > * {
    max-width: 100%;
  }

  hr {
    width: 100%;
    height: 1px;
    outline: none;
    border: none;
    background-color: #e3e3e3;
    margin: 24px 0;

    @media only screen and (max-width: 768px) {
      margin: 12px 0;
    }
  }
  h3 {
    font-size: 24px;
    margin: 32px 0 16px;

    @media only screen and (max-width: 768px) {
      font-size: 18px;
    }
  }
  p {
    margin: 24px 0;
  }
  a {
    margin: 32px 0 0;
    color: #2196f3;
    text-decoration: none;

    :hover {
      color: #2196f3;
      border-bottom: 1px dotted #2196f3;
    }
  }
`;

const ERROR_ALIVE_TIME = 1500;

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["getFormValues", "validateForm"] }] */

class Settings extends Component {
  constructor() {
    super();
    this.state = {
      showModal: false,
      passwordMessage: '',
      passwordError: '',
    };
    this.handleCustomDomain = this.handleCustomDomain.bind(this);
    this.deleteDomain = this.deleteDomain.bind(this);
    this.showModal = this.showModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.showError = this.showError.bind(this);
    this.hideError = this.hideError.bind(this);
  }

  componentDidMount() {
    if (!this.props.auth.isAuthenticated) Router.push('/login');
    this.props.getUserSettings();
  }

  componentWillUnmount() {
    if (this.hideErrorTimeoutId) {
      clearTimeout(this.hideErrorTimeoutId);
    }
  }

  getFormValues(e) {
    const form = e.target;
    const password = form.elements.password.value;

    return {
      password,
    };
  }

  validateForm({ password }) {
    if (password.length < 8) {
      return 'Password must be at least 8 chars long.';
    }

    return null;
  }

  handleCustomDomain(e) {
    e.preventDefault();
    if (this.props.domainLoading) return null;
    const customDomain = e.currentTarget.elements.customdomain.value;
    return this.props.setCustomDomain({ customDomain });
  }

  deleteDomain() {
    this.closeModal();
    this.props.deleteCustomDomain();
  }

  showModal() {
    this.setState({ showModal: true });
  }

  closeModal() {
    this.setState({ showModal: false });
  }

  showError(message) {
    this.setState(
      {
        passwordError: message,
      },
      () => {
        this.hideErrorTimeoutId = setTimeout(this.hideError, ERROR_ALIVE_TIME);
      }
    );
  }

  hideError() {
    this.setState({
      passwordError: '',
    });
  }

  changePassword(e) {
    e.preventDefault();

    const formValues = this.getFormValues(e);

    const errorMsg = this.validateForm(formValues);
    if (errorMsg) {
      return this.showError(errorMsg);
    }

    return axios
      .post(
        '/api/auth/changepassword',
        {
          password: formValues.password,
        },
        { headers: { Authorization: cookie.get('token') } }
      )
      .then(res =>
        this.setState({ passwordMessage: res.data.message }, () => {
          setTimeout(() => {
            this.setState({ passwordMessage: '' });
          }, 1500);

          const form = e.target;
          form.reset();
        })
      )
      .catch(err => {
        this.showError(err.response.data.error);
      });
  }

  render() {
    return (
      <Wrapper>
        <SettingsWelcome user={this.props.auth.user} />
        <SettingsDomain
          handleCustomDomain={this.handleCustomDomain}
          loading={this.props.domainLoading}
          settings={this.props.settings}
          showDomainInput={this.props.showDomainInput}
          showModal={this.showModal}
        />
        <hr />
        <SettingsPassword
          message={this.state.passwordMessage}
          error={this.state.passwordError}
          changePassword={this.changePassword}
        />
        <hr />
        <SettingsApi
          loader={this.props.apiLoading}
          generateKey={this.props.generateApiKey}
          apikey={this.props.settings.apikey}
        />
        <Modal show={this.state.showModal} close={this.closeModal} handler={this.deleteDomain}>
          Are you sure do you want to delete the domain?
        </Modal>
      </Wrapper>
    );
  }
}

Settings.propTypes = {
  auth: PropTypes.shape({
    isAuthenticated: PropTypes.bool.isRequired,
    user: PropTypes.string.isRequired,
  }).isRequired,
  apiLoading: PropTypes.bool,
  deleteCustomDomain: PropTypes.func.isRequired,
  domainLoading: PropTypes.bool,
  setCustomDomain: PropTypes.func.isRequired,
  generateApiKey: PropTypes.func.isRequired,
  getUserSettings: PropTypes.func.isRequired,
  settings: PropTypes.shape({
    apikey: PropTypes.string.isRequired,
    customDomain: PropTypes.string.isRequired,
    domainInput: PropTypes.bool.isRequired,
  }).isRequired,
  showDomainInput: PropTypes.func.isRequired,
};

Settings.defaultProps = {
  apiLoading: false,
  domainLoading: false,
};

const mapStateToProps = ({
  auth,
  loading: { api: apiLoading, domain: domainLoading },
  settings,
}) => ({
  auth,
  apiLoading,
  domainLoading,
  settings,
});

const mapDispatchToProps = dispatch => ({
  deleteCustomDomain: bindActionCreators(deleteCustomDomain, dispatch),
  setCustomDomain: bindActionCreators(setCustomDomain, dispatch),
  generateApiKey: bindActionCreators(generateApiKey, dispatch),
  getUserSettings: bindActionCreators(getUserSettings, dispatch),
  showDomainInput: bindActionCreators(showDomainInput, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
