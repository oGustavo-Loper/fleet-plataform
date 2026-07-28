import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";

import { fetchWithTimeout, resolveApiUrl } from "./http";
import { getStoredAuth } from "./storage";

const apiUrl = resolveApiUrl();

const authLink = new ApolloLink((operation, forward) => {
  const auth = getStoredAuth();
  const authorization = auth?.accessToken ? `Bearer ${auth.accessToken}` : "";

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(authorization ? { Authorization: authorization } : {})
    }
  }));

  return forward(operation);
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    authLink,
    new HttpLink({
      uri: apiUrl,
      fetch: fetchWithTimeout
    })
  ]),
  cache: new InMemoryCache()
});
