import { LeanPricing } from '../../types/models/Pricing';
import { LeanService } from '../../types/models/Service';
import { resetEscapeVersion } from '../helpers';

function resetEscapeVersionInService(service: LeanService): void {
  for (const version in service.activePricings) {
    const formattedVersion = resetEscapeVersion(version);

    if (formattedVersion !== version && service.activePricings[version]) {
      service.activePricings[formattedVersion] = {
        ...service.activePricings[version],
      };
  
      delete service.activePricings[version];
    }

  }

  for (const version in service.archivedPricings) {
    const formattedVersion = resetEscapeVersion(version);

    if (formattedVersion !== version && service.archivedPricings[version]) {
      service.archivedPricings[formattedVersion] = {
        ...service.archivedPricings[version],
      };
  
      delete service.archivedPricings[version];
    }
  }
}

function resetEscapePricingVersion(pricing: LeanPricing){
  pricing.version = resetEscapeVersion(pricing.version);
}

export { resetEscapeVersionInService, resetEscapePricingVersion };
