<template>
  <div v-if="form">
    <div class="p-4 pb-5">
      <cr-filter-inline-select
        v-if="!props.forceOperator"
        v-model="form.operator"
        :prefix="`${props.config.label}:`"
        class="mb-3"
        :options="numberFilterOperators"
      />
      <div class="flex -mx-1">
        <div class="flex-grow px-1">
          <cr-filter-input
            v-model="form.value"
            type="number"
            min="0"
            step="1"
            :placeholder="!isBetween ? 'Enter value' : 'From'"
            data-qa="filter-number-from"
            @blur="$v.value.$touch"
            @change="$v.value.$touch"
          />
        </div>
        <div v-if="isBetween" class="flex-grow px-1">
          <app-form-item
            :validation="$v.valueTo"
            class="mb-0"
            :show-error="false"
            :filter-errors="['minValue']"
          >
            <cr-filter-input
              v-model="form.valueTo"
              type="number"
              placeholder="To"
              min="0"
              data-qa="filter-number-to"
              @blur="$v.valueTo.$touch"
              @change="$v.valueTo.$touch"
            />
          </app-form-item>
        </div>
      </div>
      <app-form-errors
        :validation="$v"
        error-icon="ri-error-warning-line"
        error-class="relative pt-0"
        :error-messages="{
          'valueTo-minValue': `Number should be higher than “From” field`,
        }"
        :hide-default="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import {
  NumberFilterConfig,
  NumberFilterOptions,
  NumberFilterValue,
} from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import useVuelidate from '@vuelidate/core';
import {
  integer, minValue, numeric, required,
} from '@vuelidate/validators';
import {
  FilterNumberOperator,
  numberFilterOperators,
} from '@/shared/modules/filters/config/constants/number.constants';
import CrFilterInput from '@/shared/modules/filters/components/partials/string/FilterInput.vue';
import CrFilterInlineSelect from '@/shared/modules/filters/components/partials/FilterInlineSelect.vue';
import AppFormErrors from '@/shared/form/form-errors.vue';
import AppFormItem from '@/shared/form/form-item.vue';

const props = defineProps<{
  modelValue: NumberFilterValue,
  config: NumberFilterConfig
} & NumberFilterOptions>();

const emit = defineEmits<{(e: 'update:modelValue', value: NumberFilterValue): void}>();

const form = computed<NumberFilterValue>({
  get: () => props.modelValue,
  set: (value: NumberFilterValue) => emit('update:modelValue', value),
});

const defaultForm: NumberFilterValue = {
  value: '',
  operator: FilterNumberOperator.EQ,
};

const rules: any = computed(() => ({
  value: {
    required,
    numeric,
    integer,
    minValue: minValue(0),
  },
  ...(isBetween.value ? {
    valueTo: {
      required,
      numeric,
      integer,
      minValue: minValue((form.value.value) || 0),
    },
  } : {}),
  operator: {
    required,
  },
}));

const isBetween = computed<boolean>(() => ([
  FilterNumberOperator.BETWEEN,
  FilterNumberOperator.NOT_BETWEEN,
] as FilterNumberOperator[]).includes(form.value.operator));

const $v = useVuelidate(rules, form);

watch(() => form.value.operator, (operator, previousOperator) => {
  const isPreviousBetweenOperator = ([
    FilterNumberOperator.BETWEEN,
    FilterNumberOperator.NOT_BETWEEN,
  ] as FilterNumberOperator[]).includes(previousOperator);
  const isCurrentBetweenOperator = ([
    FilterNumberOperator.BETWEEN,
    FilterNumberOperator.NOT_BETWEEN,
  ] as FilterNumberOperator[]).includes(operator);
  if (!isCurrentBetweenOperator) {
    delete form.value.valueTo;
  } else if (isCurrentBetweenOperator !== isPreviousBetweenOperator) {
    form.value.valueTo = '';
  }
});

onMounted(() => {
  if (props.forceOperator && props.forceOperator.length > 0) {
    form.value = {
      ...defaultForm,
      ...form.value,
      operator: props.forceOperator,
    };
  } else {
    form.value = {
      ...defaultForm,
      ...form.value,
    };
  }
});
</script>

<script lang="ts">
export default {
  name: 'CrNumberFilter',
};
</script>
