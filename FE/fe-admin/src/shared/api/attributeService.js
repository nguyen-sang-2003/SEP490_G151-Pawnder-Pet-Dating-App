import apiClient from './apiClient';
import { API_ENDPOINTS } from '../constants';

const normalizeAttribute = (attr = {}) => ({
  id: attr.attributeId ?? attr.AttributeId ?? 0,
  name: attr.name ?? attr.Name ?? '',
  typeValue: attr.typeValue ?? attr.TypeValue ?? '',
  unit: attr.unit ?? attr.Unit ?? '',
  isDeleted: attr.isDeleted ?? attr.IsDeleted ?? false,
  options:
    attr.optionRespones ||
    attr.optionResponses ||
    attr.options ||
    attr.Options ||
    [],
});

const normalizeOption = (opt = {}) => ({
  id: opt.optionId ?? opt.OptionId ?? 0,
  attributeId: opt.attributeId ?? opt.AttributeId ?? null,
  name: opt.name ?? opt.Name ?? '',
  isDeleted: opt.isDeleted ?? opt.IsDeleted ?? false,
});

const attributeService = {
  async getAttributes(params = {}) {
    const query = {
      page: 1,
      pageSize: 50,
      includeDeleted: false,
      ...params,
    };

    const response = await apiClient.get(API_ENDPOINTS.ATTRIBUTES.LIST, {
      params: query,
    });

    const items = response.data || response.Data || response.items || response.Items || [];
    const pagination =
      response.pagination ||
      response.Pagination || {
        page: query.page,
        pageSize: query.pageSize,
        total: items.length,
      };

    return {
      items: items.map(normalizeAttribute),
      pagination,
    };
  },

  async createAttribute(payload) {
    const response = await apiClient.post(API_ENDPOINTS.ATTRIBUTES.CREATE, payload);
    const data = response.data || response.Data || response;
    return normalizeAttribute(data);
  },

  async updateAttribute(attributeId, payload) {
    const response = await apiClient.put(API_ENDPOINTS.ATTRIBUTES.UPDATE(attributeId), payload);
    const data = response.data || response.Data || payload;
    return normalizeAttribute({ ...data, attributeId });
  },

  async deleteAttribute(attributeId, { hard = false } = {}) {
    return apiClient.delete(API_ENDPOINTS.ATTRIBUTES.DELETE(attributeId), {
      params: { hard },
    });
  },

  async getAttributeOptions(attributeId) {
    const response = await apiClient.get(API_ENDPOINTS.ATTRIBUTE_OPTIONS.LIST_BY_ATTRIBUTE(attributeId));
    const options = Array.isArray(response.data || response) ? response.data || response : response;
    return options.map(normalizeOption);
  },

  async createOption(attributeId, name) {
    const response = await apiClient.post(
      API_ENDPOINTS.ATTRIBUTE_OPTIONS.CREATE(attributeId),
      name
    );
    const data = response.data || response.Data || response;
    return normalizeOption({ ...data, attributeId });
  },

  async updateOption(optionId, name) {
    const response = await apiClient.put(
      API_ENDPOINTS.ATTRIBUTE_OPTIONS.UPDATE(optionId),
      name
    );
    const data = response.data || response.Data || response;
    return normalizeOption({ ...data, optionId });
  },

  async deleteOption(optionId) {
    return apiClient.delete(API_ENDPOINTS.ATTRIBUTE_OPTIONS.DELETE(optionId));
  },
};

export default attributeService;

