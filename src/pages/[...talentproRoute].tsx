import type { GetServerSideProps } from "next";
import { talentProRoutes } from "@/TalentProATS/routes";

type TalentProRoutePageProps = {
  routeKey: string;
};

export default function TalentProRoutePage({ routeKey }: TalentProRoutePageProps) {
  const PageComponent = talentProRoutes[routeKey];
  return <PageComponent />;
}

export const getServerSideProps: GetServerSideProps<TalentProRoutePageProps> = async (context) => {
  const slug = context.params?.talentproRoute;
  const routeParts = Array.isArray(slug) ? slug : slug ? [slug] : [];
  const routeKey = routeParts.join("/");

  if (!talentProRoutes[routeKey]) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      routeKey,
    },
  };
};
