import { AmbientColor } from '@/components/decorations/ambient-color';
import DynamicZoneManager from '@/components/dynamic-zone/manager'

export default function PageContent({ pageData, isHomepage = false }: { pageData: any; isHomepage?: boolean }) {
  const dynamicZone = pageData?.dynamic_zone;
  return (
    <main className="relative overflow-hidden w-full">
      <AmbientColor />
      {dynamicZone && (<DynamicZoneManager dynamicZone={dynamicZone} locale={pageData.locale} isHomepage={isHomepage} />)}
    </main>
  );
}
