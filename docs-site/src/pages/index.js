import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {Redirect} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  const homeUrl = useBaseUrl('/introduction');
  return <Redirect to={homeUrl} />;
} 