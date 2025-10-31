import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Items from './Items';

jest.mock('../services/itemService');

describe('Items component', () => {
  it('renders the component', async () => {
    render(
      <Router>
        <Items />
      </Router>
    );

    expect(screen.getByText('Items')).toBeInTheDocument();
  });
});
