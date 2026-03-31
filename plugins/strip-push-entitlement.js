const { withEntitlementsPlist } = require("expo/config-plugins");

/**
 * Strips the aps-environment (Push Notifications) entitlement from iOS builds.
 * This is needed because expo-notifications auto-adds it, but free/personal
 * Apple developer accounts cannot provision push notifications.
 *
 * Remove this plugin once you have a paid Apple Developer Program membership.
 */
module.exports = function stripPushEntitlement(config) {
  return withEntitlementsPlist(config, (mod) => {
    delete mod.modResults["aps-environment"];
    return mod;
  });
};
