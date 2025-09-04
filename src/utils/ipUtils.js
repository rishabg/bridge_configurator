import ipaddr from 'ipaddr.js';

export const validateIp = (ip) => {
    return ipaddr.isValid(ip);
};

export const getIpVersion = (ip) => {
    if (ipaddr.isValid(ip)) {
        return ipaddr.parse(ip).kind();
    }
    return null;
};

const convertSubnetToCidr = (subnet, ipForVersionDetection) => {
    if (!subnet) return null;
    const subnetString = String(subnet).trim();
    const ipVersion = getIpVersion(ipForVersionDetection) || 'ipv4';

    // Check for CIDR
    if (!isNaN(subnetString)) {
        const cidr = parseInt(subnetString, 10);
        const maxCidr = ipVersion === 'ipv6' ? 128 : 32;
        if (Number.isInteger(cidr) && cidr >= 0 && cidr <= maxCidr) {
            return cidr;
        }
    }

    // Check for dotted-decimal (only for IPv4)
    if (ipVersion === 'ipv4' && ipaddr.IPv4.isValid(subnetString)) {
        try {
            const addr = ipaddr.IPv4.parse(subnetString);
            return addr.prefixLengthFromSubnetMask();
        } catch (e) {
            return null;
        }
    }

    return null;
};

export const validateSubnet = (subnet, ipAddress) => {
    return convertSubnetToCidr(subnet, ipAddress) !== null;
};

export const isPublicIp = (ip) => {
    if (!validateIp(ip)) return false;
    
    try {
        const addr = ipaddr.parse(ip);
        const range = addr.range();
        return range === 'unicast';
    } catch (e) {
        return false;
    }
};

export const isSameSubnet = (ip1, ip2, subnet) => {
    const cidr = convertSubnetToCidr(subnet, ip1);
    if (!validateIp(ip1) || !validateIp(ip2) || cidr === null) {
        return false;
    }
    try {
        const addr1 = ipaddr.parse(ip1);
        const addr2 = ipaddr.parse(ip2);

        if (addr1.kind() !== addr2.kind()) {
            return false;
        }
        
        return addr1.match(addr2, cidr);
    } catch (e) {
        return false;
    }
};

export const checkIpAndSubnet = (ip, subnet) => {
    const cidr = convertSubnetToCidr(subnet, ip);
    if (!validateIp(ip) || cidr === null) {
        return 'Invalid IP or Subnet format.';
    }
    try {
        const addr = ipaddr.parse(ip);
        if (addr.kind() === 'ipv4') {
            const cidrStr = `${ip}/${cidr}`;
            const networkAddress = ipaddr.IPv4.networkAddressFromCIDR(cidrStr).toString();
            const broadcastAddress = ipaddr.IPv4.broadcastAddressFromCIDR(cidrStr).toString();

            if (ip === networkAddress && cidr < 31) {
                return 'IP address cannot be the network address.';
            }
            if (ip === broadcastAddress && cidr < 31) {
                return 'IP address cannot be the broadcast address.';
            }
        } else { // ipv6
            const networkAddress = addr.mask(cidr).toString();
            if (ip === networkAddress && cidr < 127) {
                return 'IP address cannot be the network address.';
            }
        }
        return null; // No error
    } catch (e) {
        return 'Invalid subnet mask.';
    }
};
