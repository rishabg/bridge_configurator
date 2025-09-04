import React, { useState, useEffect } from 'react';
import './IpConfigurator.css';
import { validateIp, isPublicIp, isSameSubnet, checkIpAndSubnet, validateSubnet, getIpVersion } from '../utils/ipUtils';

const IpConfigurator = () => {
    const [configType, setConfigType] = useState('dhcp');
    const [ipAddress, setIpAddress] = useState('');
    const [subnet, setSubnet] = useState('');
    const [gateway, setGateway] = useState('');
    const [dnsServers, setDnsServers] = useState(['']);
    const [errors, setErrors] = useState({});
    const [showSummary, setShowSummary] = useState(false);
    const [copySuccess, setCopySuccess] = useState('');

    useEffect(() => {
        if (configType === 'static') {
            validateInputs();
        } else {
            setErrors({});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [configType, ipAddress, subnet, gateway, dnsServers]);

    const handleDnsChange = (index, value) => {
        const newDnsServers = [...dnsServers];
        newDnsServers[index] = value;
        setDnsServers(newDnsServers);
    };

    const addDnsServer = () => {
        if (dnsServers.length < 3) {
            setDnsServers([...dnsServers, '']);
        }
    };

    const removeDnsServer = (index) => {
        const newDnsServers = dnsServers.filter((_, i) => i !== index);
        setDnsServers(newDnsServers);
    };

    const validateInputs = () => {
        const newErrors = {};

        if (!ipAddress) newErrors.ipAddress = 'IP Address is required.';
        if (!subnet) newErrors.subnet = 'Subnet Mask is required.';
        if (!gateway) newErrors.gateway = 'Gateway is required.';

        const isIpValid = validateIp(ipAddress);
        const isSubnetValid = validateSubnet(subnet, ipAddress);
        const isGatewayValid = validateIp(gateway);

        if (ipAddress && !isIpValid) newErrors.ipAddress = 'Invalid IP Address format.';
        if (subnet && !isSubnetValid) newErrors.subnet = 'Invalid Subnet Mask format.';
        if (gateway && !isGatewayValid) newErrors.gatewayInvalid = 'Invalid Gateway IP Address format.';

        if (isIpValid && isSubnetValid) {
            const ipSubnetError = checkIpAndSubnet(ipAddress, subnet);
            if (ipSubnetError) {
                newErrors.ipSubnet = ipSubnetError;
            }
        }

        if (isIpValid && isPublicIp(ipAddress)) {
            newErrors.ipAddressPublic = 'Warning: You are using a public IP address. This is likely incorrect.';
        }

        if (gateway && isGatewayValid && isIpValid && isSubnetValid) {
            const ipVersion = getIpVersion(ipAddress);
            const gatewayVersion = getIpVersion(gateway);
            if (ipVersion !== gatewayVersion) {
                newErrors.gatewayVersion = 'Gateway must be the same IP version as the IP Address.';
            } else if (!isSameSubnet(ipAddress, gateway, subnet)) {
                newErrors.gatewaySubnet = 'Warning: Gateway appears to be on a different subnet.';
            }
        }

        const dnsWithValues = dnsServers.filter(dns => dns.trim() !== '');
        if (dnsWithValues.length === 0) {
            newErrors.dns = 'Warning: No DNS server specified. A public DNS server (e.g., 8.8.8.8) will be used.';
        }

        dnsServers.forEach((dns, index) => {
            if (dns.trim() !== '' && !validateIp(dns)) {
                newErrors[`dns_${index}`] = `DNS Server ${index + 1} has an invalid IP Address format.`;
            }
        });

        setErrors(newErrors);
    };

    const handleGenerateSummary = () => {
        setShowSummary(true);
        setCopySuccess('');
    };

    const summaryText = `IP Address: ${ipAddress}\nSubnet Mask: ${subnet}\nGateway: ${gateway}\nDNS Servers: ${dnsServers.filter(dns => dns.trim()).join(', ') || 'None'}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(summaryText).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Failed to copy!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    const errorKeys = ['ipAddress', 'subnet', 'gateway', 'gatewayInvalid', 'ipSubnet', 'gatewayVersion'];
    const dnsErrorKeys = Object.keys(errors).filter(key => key.startsWith('dns_'));
    const hasErrors = errorKeys.some(key => errors[key]) || dnsErrorKeys.length > 0;

    const isFormValid = configType === 'static' && ipAddress && subnet && gateway && !hasErrors;

    return (
        <div className="configurator">
            <div className="form-group">
                <label>Configuration Type:</label>
                <select value={configType} onChange={(e) => setConfigType(e.target.value)}>
                    <option value="dhcp">DHCP</option>
                    <option value="static">Static IP</option>
                </select>
            </div>

            {configType === 'dhcp' && (
                <div className="status-ok">
                    <p>DHCP configuration is selected. The bridge will obtain network settings automatically.</p>
                </div>
            )}

            {configType === 'static' && (
                <div className="static-config">
                    <div className="form-group">
                        <label htmlFor="ipAddress">IP Address:*</label>
                        <input
                            type="text"
                            id="ipAddress"
                            value={ipAddress}
                            onChange={(e) => setIpAddress(e.target.value)}
                        />
                        {errors.ipAddress && <p className="error">{errors.ipAddress}</p>}
                        {errors.ipSubnet && <p className="error">{errors.ipSubnet}</p>}
                        {errors.ipAddressPublic && <p className="warning">{errors.ipAddressPublic}</p>}
                        <p className="help-text">Examples: 192.168.1.10, 2001:db8::1</p>
                    </div>
                    <div className="form-group">
                        <label htmlFor="subnet">Subnet Mask:*</label>
                        <input
                            type="text"
                            id="subnet"
                            value={subnet}
                            onChange={(e) => setSubnet(e.target.value)}
                        />
                        {errors.subnet && <p className="error">{errors.subnet}</p>}
                        <p className="help-text">Examples: 255.255.255.0 or 24 (for IPv4), 64 (for IPv6).</p>
                    </div>
                    <div className="form-group">
                        <label htmlFor="gateway">Gateway:*</label>
                        <input
                            type="text"
                            id="gateway"
                            value={gateway}
                            onChange={(e) => setGateway(e.target.value)}
                        />
                        {errors.gateway && <p className="error">{errors.gateway}</p>}
                        {errors.gatewayVersion && <p className="error">{errors.gatewayVersion}</p>}
                        {errors.gatewaySubnet && <p className="warning">{errors.gatewaySubnet}</p>}
                        {errors.gatewayInvalid && <p className="error">{errors.gatewayInvalid}</p>}
                        <p className="help-text">Examples: 192.168.1.1, 2001:db8::ffff</p>
                    </div>
                    <div className="form-group">
                        <label>DNS Servers:</label>
                        {dnsServers.map((dns, index) => (
                            <div key={index} className="dns-entry">
                                <input
                                    type="text"
                                    value={dns}
                                    onChange={(e) => handleDnsChange(index, e.target.value)}
                                    placeholder="DNS Server (optional)"
                                />
                                {dnsServers.length > 1 && (
                                    <button type="button" onClick={() => removeDnsServer(index)}>Remove</button>
                                )}
                                {errors[`dns_${index}`] && <p className="error">{errors[`dns_${index}`]}</p>}
                            </div>
                        ))}
                        {dnsServers.length < 3 && (
                            <button type="button" onClick={addDnsServer}>Add DNS Server</button>
                        )}
                        {errors.dns && <p className="warning">{errors.dns}</p>}
                        <p className="help-text">Examples: 8.8.8.8, 2001:4860:4860::8888</p>
                    </div>

                    {isFormValid && !showSummary && (
                        <button type="button" onClick={handleGenerateSummary} className="summary-button">
                            Generate Summary
                        </button>
                    )}
                    {showSummary && (
                        <div className="summary-section">
                            <h3>Configuration Summary</h3>
                            <textarea readOnly value={summaryText} rows="5" />
                            <button type="button" onClick={handleCopy}>Copy to Clipboard</button>
                            {copySuccess && <span className="copy-success">{copySuccess}</span>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default IpConfigurator;
