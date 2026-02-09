import "server-only";
import { AboutUsService } from "@/lib/services/aboutUs/aboutUs.service"
import { unstable_cache } from "next/cache";

export const getAboutUsData = unstable_cache(
  async () => new AboutUsService().getAboutUsData(),
  ["aboutUsData"],
  { revalidate: 3600 * 24 * 15 }
);
export const useAboutUs = async () => {
    const aboutUsData = await getAboutUsData();

    return {
        nuclei: aboutUsData.nuclei,
        members: aboutUsData.members
    }
}