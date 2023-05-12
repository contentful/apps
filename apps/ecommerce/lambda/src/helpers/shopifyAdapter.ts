import { Product } from 'shopify-buy'
import { HydratedResourceData } from '../types'

export const convertResponseToResource = (product: Product): HydratedResourceData => {
    return {
        name: product.title,
        description: product.description,
        image: product.images[0].url,
        status: product.availableForSale ? 'Available' : 'Not Available',
        extras: {
            ...product
        }
    }
}